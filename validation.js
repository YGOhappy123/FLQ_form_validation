function Validator(options) { 

//lấy thẻ parent (không quan trọng cấp bậc)
function getPerent (element, selector) {
    while (element.parentElement) {
        if (element.parentElement.matches(selector)) {
            return element.parentElement
        }
        element = element.parentElement
    }
}

//duyệt riêng từng rule, gán kết quả vào biến báo lỗi => chạy test function với đối số là dữ liệu user nhập vào
var selectorRules = {}

    function validate (inputElement, rule) {
        var errorMessage;
        var errorElement = getPerent(inputElement,options.formGroupSelector).querySelector(options.errorSelector)

        var rules = selectorRules[rule.selector]
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            
            if (errorMessage) break
        }
        // quá trình báo lỗi (nếu có)
        if (errorMessage) {
            errorElement.innerText = errorMessage
            getPerent(inputElement,options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getPerent(inputElement,options.formGroupSelector).classList.remove('invalid')
        }   
        return !errorMessage // converse sang boolean để check cho submit
    }
    
    var isFormValid = true
    var formElement = document.querySelector(options.form)
    
    //kiểm tra lại khi user ấn submit
    if (formElement) {
        formElement.onsubmit = function (e) {
            e.preventDefault() // bỏ hành vi tự re-direct
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid =  validate(inputElement, rule)
                if (!isValid) {
                    isFormValid = false
                }
            })

            //nếu đã không còn lỗi thì lấy ra dữ liệu người dùng            
            if (isFormValid) {
                if (typeof options.onSubmit === 'function') {

                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                    var formValues = Array.from(enableInputs).reduce( function(values, input) {
                        
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector(`input[name="${input.name}"]:checked`).value
                                break   
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    return values
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = []
                                }
                                    values[input.name].push(input.value)
                                break
                            case 'file':
                                values[input.name] = input.files
                                break
                                
                            default: values[input.name] = input.value
                        }                      
                        return values
            }, {}) 

                    options.onSubmit(formValues)    //submit với JS
                } else {
                    formElement.submit()  //cài lại default vào
                }
            }
        }

        // duyệt qua từng rule (không ghi đè)
        options.rules.forEach(function (rule) {  
            
            if (Array.isArray (selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }
            
            // lấy ra dữ liệu người dùng nhập vào và bắt đầu validate
            var inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach(function (inputElement) {    

                if (inputElement) {
                    inputElement.onblur = function () {
                      validate(inputElement, rule)                   
                    }
                 
                // tắt thông báo lỗi khi nguwofi dùng bắt đầu nhập lại    
                inputElement.oninput = function () {
                    var errorElement = getPerent(inputElement,options.formGroupSelector).querySelector(options.errorSelector)
                    errorElement.innerText = ''
                    getPerent(inputElement,options.formGroupSelector).classList.remove('invalid')
                    }
                }            
            })
        })
    }
}
// Định nghĩa các rules xác định tính phù hợp
// Nguyên tắc: hợp lệ thì undefined (không có gì xảy ra), có lỗi thì hiện câu thông báo message (nếu có), hoặc trả về câu chung
Validator.isRequired = function (selector,message) {
    return {
        selector: selector,
        test: function (value) {
            return value? undefined : message || 'Vui lòng nhập nội dung này'
        }   // return ngược lên options.rules
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value) ? undefined : message || 'Nội dung nhập vào không hợp lệ'
        }
    }
}

Validator.isPhoneNumber = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(value) ? undefined : message || 'Nội dung nhập vào không hợp lệ'
        }
    }
}

Validator.isLongEnough = function (selector, min) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`
        }
    }
}

Validator.isConfirmed = function (selector, confirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === confirmValue() ? undefined : message || 'Giá trị nhập vào không khớp'
        }
    }
}