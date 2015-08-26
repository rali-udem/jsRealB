function htmlEncode(value)
{
    if(value)
    {
        return $("<div />").text(value).html();
    }
    else
    {
        return '';
    }
}

function htmlDecode(value)
{
    if(value)
    {
        return $("<div />").html(value).text();
    }
    else
    {
        return '';
    }
}

/*
 * String
 */
String.prototype.capitalizeFirstLetter = function()
{
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalize = function () 
{
    return this.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};