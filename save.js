
$("document").ready(function(){
    
    $("#save").on("click", save_options.bind(this));
    $('#cmn-toggle-1').on("change", save_options.bind(this));
    load_options();
});

function save_options() {
  var yesOrNo = $("#cmn-toggle-1").is(":checked");
  localStorage["asos_disco"] = yesOrNo;
  setStatus(yesOrNo);
}

function load_options() {
    var yesOrNo = ( typeof(localStorage["asos_disco"]) === "undefined" ) || (localStorage["asos_disco"] === "true");
    
    if(yesOrNo){
        $("#cmn-toggle-1").attr("checked", true);
        setStatus(yesOrNo);
    }else{
        setStatus(yesOrNo);
        $("#cmn-toggle-1").attr("checked", false);
    }
}

function setStatus(yesOrNo){
    var status = yesOrNo ? "ON" : "OFF";
    $("#status").text(status);
}