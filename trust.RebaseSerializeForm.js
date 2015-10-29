//Rebases a form to serializedToArray format
//Example call: $(ips.formId).serializeArrayWithRebaseing()
$.fn.serializeArrayWithRebaseing = function () {
    var form = this.serializeArray();

    //will hold old / new values for re-basing process
    var temp = {
        resetObjectIndex: {}
    };

    //any [] within the individual property tested are classes/arrays/lists indexes
    function hasIndexer(propName) {
        return propName.indexOf('[') !== -1;
    }

    //A child Index would be considered anything following the  
    //  current obcject property, ex: CurrentProperty[12].NextLevel[11]
    //  where .NextLevel[11] is a child of CurrentProperty[12]
    //IF a parent object has been incremented, all child objects 
    //  found in getPropertyLevels() function will have to have 
    //  their 'new' index reset to base.
    function setChildIndexesToBeReset(currentIndex) {
        //If this is a parent and its being reset, set the children to be reset
        for (var i = currentIndex + 1; i < Object.keys(temp.resetObjectIndex).length; i++) {
            temp.resetObjectIndex[i] = true;
        }
    }

    //If child object has been marked to reset, then reset it here
    function resetChildIndex(currentIndex, pName) {
        if (temp.resetObjectIndex[currentIndex] === true) {
            temp.resetObjectIndex[currentIndex] = false;
            temp[pName].newIndex = undefined;
        }
    }

    //If the .oldIndex didn't match the current Property's index (pIndex) then its time to increment .newIndex and set .oldIndex to the new Current value
    function incrementObjectIndex(pIndex, pName) {
        temp[pName].oldIndex = pIndex;
        temp[pName].newIndex = temp[pName].newIndex === undefined ? 0 : temp[pName].newIndex + 1;
    }

    //Find and rebase the object's property's if applicable.
    function rebaseProperties(properties) {
        var rebasedProp = '';
        for (var i = 0; i < properties.length; i++) {
            
            if (hasIndexer(properties[i])) {

                var pIndex = properties[i].substring(properties[i].indexOf('[') + 1, properties[i].indexOf(']'));
                var pName = properties[i].substring(0, properties[i].indexOf('['));

                //create object property if it doesn't exist
                if (temp[pName] === undefined) { temp[pName] = {}; }

                //Does the current object need rebased?
                if (temp[pName].oldIndex !== pIndex) {
                    setChildIndexesToBeReset(i);
                    resetChildIndex(i, pName);
                    incrementObjectIndex(pIndex, pName);
                }
                //replace property with the new index
                properties[i] = properties[i].replace(new RegExp('[[0-9]*]'), '[' + temp[pName].newIndex + ']');
            }
            
            //Combine the properties back to its origional form separated by ('.')
            rebasedProp += rebasedProp === '' ? properties[i] : '.' + properties[i];
        }
        return rebasedProp;
    }

    //Find and rebase the form property if applicable
    function rebaseFormProperty(name) {
        var properties = name.split('.');   //Properties are seperated by ('.')
        if (properties.length) {            //If the .name property has actual properties
            name = rebaseProperties(properties);
        }
        return name;
    }

    //Finding the forms longest name property after serialization 
    //  will yield us how many lists are within the form
    //These are required to reset when a parent list has it's count reset, 
    //  whereafter the child lists will need their 'new' indexes reset
    //The reason we're doing this here is because not every form[i].name 
    //  attribute has all lists within the form and therefor can't 
    //  determine how deep the page actually goes and/or needs reset
    function getPropertyLevels() {
        var longest = form.sort(function (a, b) { return b.name.lastIndexOf(']') - a.name.lastIndexOf(']'); })[0];

        //splitting by properties within the string which are separated by ('.')     
        $.each(longest.name.split('.'), function (key, value) {
            if (hasIndexer(value)) {
                //key prepresents the current index of classes found thoughout the form
                if (temp.resetObjectIndex[key] === undefined) {
                    temp.resetObjectIndex[key] = false;
                }
            }
        });
    }
    
    //Start
    getPropertyLevels(); //Think of this as the init()
    $.each(form, function () {
        this.name = rebaseFormProperty(this.name);
    });
    return form;
};