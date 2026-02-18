function encryptFormData(encryptionExponent, decryptionExponent, modulus) {
    setMaxDigits(259);
    var key = new RSAKeyPair(encryptionExponent, "", modulus);
    var input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "encrypted");
    input.setAttribute("value", "true");
    var forms = document.forms;
    for (var j = 0; j < forms.length; j++) {
        var form = document.forms[j];
        form.appendChild(input);
        if (form == null)
            continue;
        for (var i = 0; i < form.length; i++) {
            if (form.elements[i] == null || form.elements[i].type == null)
                continue;

            if (form.elements[i].name.toLowerCase() == "f")
                continue;

            if (form.elements[i].type.toLowerCase() == "password") {
                var value = form.elements[i].value;
                if (value != null && value.length > 0) {
                    var encryptedValue = encryptedString(key, value);
                    form.elements[i].value = encryptedValue;
                }
            }

            else if (form.elements[i].type.toLowerCase() == "text" || form.elements[i].type.toLowerCase() == "textarea" || form.elements[i].type.toLowerCase() == "radio") {
                var value = form.elements[i].value;
                if (value != null && value.length > 0) {
                    var encryptedValue = encryptedString(key, value);
                    copyValue(form.elements[i], encryptedValue);
                    //form.elements[i].value = encryptedValue;
                }
            }
            else if (form.elements[i].type.toLowerCase() == "checkbox") {
                var value = form.elements[i].checked;
                //if(value != null && value.length > 0) {
                var encryptedValue = encryptedString(key, value == true ? "true" : "false");
                copyValue(form.elements[i], encryptedValue);
                //form.elements[i].value = encryptedValue;
                //} 
            }
            else if (form.elements[i].type.toLowerCase() == "select-one") {
                var index = form.elements[i].selectedIndex;
                var options = form.elements[i].options;
                if (options[index] != null && options[index].value != null && options[index].value.length > 0) {
                    var encryptedValue = encryptedString(key, options[index].value);
                    //options[index ].value = encryptedValue;
                    copyValue(form.elements[i], encryptedValue);
                }
            }
        }
    }
    return true;
}

function copyValue(uiField, encryptedValue) {
    var id = uiField.id;
    if (id != null && id.length > 0) {
        var index = id.lastIndexOf("Ui");
        if (index != null && index > 0) {
            var hFieldId = id.substring(0, index);
            var hField = document.getElementById(hFieldId);
            if (hField != null) {
                hField.value = encryptedValue;
            }
        }
    }
    return;
}

function encryptCredentials(encryptionExponent, decryptionExponent, modulus, input) {
    setMaxDigits(259);
    key = new RSAKeyPair(encryptionExponent, "", modulus);
    var text = document.getElementById(input).value;
    var envalue = encryptedString(key, text);
    document.getElementById(input).value = envalue;
    return;
}
