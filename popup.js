var startButton;
var stopButton;
var isStarted=false;
var hideElement=$("<div></div>").css({
    "background-color": "rgba(113,113,115,0.7)",
    position:"absolute"
});


sendMessage("isStarted",function (resp) {
    isStarted=resp.result;
    hideStartOrStop();
});


function ready() {
    startButton=$("#start");
    startButton.on("click",start);
    stopButton=$("#stop");
    stopButton.on("click",stop);
    $("#apply").on("click",save);
    $("body").append(hideElement);
    chrome.storage.sync.get(["algorithm","max_damage","max_profit"],function (items) {
        var alg=items["algorithm"]?items["algorithm"]:"hard_chase";
        $("[name=algorithm][value="+alg+"]").prop("checked",true);
        $("#max_damage").val(items["max_damage"]?items["max_damage"]:"2000");
        $("#max_profit").val(items["max_profit"]?items["max_profit"]:"4000");
    });
}


function start() {
    var objToSend={
        command:"start",
        algorithm:$("[name=algorithm]:checked").attr("value"),
        max_damage:+$("#max_damage").val(),
        max_profit:+$("#max_profit").val()
    };
    isStarted=true;
    hideStartOrStop();
    sendMessage(objToSend,function (resp) {
        if (resp.result=="error"){
            alert("Error:can't start! "+resp.message);
            isStarted=false;
            hideStartOrStop();
        }
    });
}


function stop() {
    isStarted=false;
    hideStartOrStop();
    sendMessage("stop",function (resp) {
        if (resp.result=="error"){
            alert("Error:can't stop! "+resp.message);
            isStarted=true;
            hideStartOrStop();
        }
    });
}

function save() {
    chrome.storage.sync.set({
        max_damage:$("#max_damage").val(),
        algorithm:$("[name=algorithm]:checked").val(),
        max_profit:$("#max_profit").val()
    });
}
function hideStartOrStop() {
    if (isStarted) {
        hideElement.css({
           width:startButton.outerWidth()+"px",
           height:startButton.outerHeight()+"px",
            left:startButton.offset().left+"px",
            top:startButton.offset().top+"px",
        });
    }
    else {
        hideElement.css({
            width:stopButton.outerWidth()+"px",
            height:stopButton.outerHeight()+"px",
            left:stopButton.offset().left+"px",
            top:stopButton.offset().top+"px",
        });
    }
}


function sendMessage(command,callback) {
    if (!callback) callback=function () {};
    var objToSend;
    if (typeof command=="object"){
        objToSend=command;
    }
    else {
        objToSend={
            command:command
        }
    }
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, objToSend, callback);
    });
}


window.addEventListener("load",ready);