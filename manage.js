var buttonDown;
var buttonUp;
var inputAmount;
var spanAmount;
var inputHours;
var inputMinutes;
var curMoney;
var isStarted=false;
var isReady=false;
var timerId=setTimeout(initialization,3000);
var port;



function initialization() {
    buttonDown=$("[data-test=deal-button-down]");
    buttonUp=$("[data-test=deal-button-up]");
    inputAmount=$("input.input-currency__input");
    inputHours=$("input.timeinput__input_hours");
    inputMinutes=$("input.timeinput__input_minutes");
    curMoney=$("span.header-row__balance-sum");
    spanAmount=$("span.input-currency__value");
    if (buttonDown.length!=0&&buttonUp.length!=0&&inputAmount.length!=0&&inputHours.length!=0&&
            inputMinutes.length!=0&&curMoney.length!=0&&spanAmount.length!=0) {
        clearTimeout(timerId);
        port = chrome.runtime.connect({name: "bet"});
        port.onMessage.addListener((msg)=>{
            if (msg.status=="OK"){
                algorithmManager.move();
            }
        });
        isReady=true;
    }
    else setTimeout(initialization,1000);
}



function start(request) {
    if (!isReady) return {result:"error",message:"try later"};
    algorithmManager.initialization(request);
    algorithmManager.manage(algorithmManager);
    isStarted=true;
    console.log("СТАРТ");
    return {result:"success"};

}


function stop(request) {
    if (isStarted){
        algorithmManager.isStopped=true;
        isStarted=false;
        clearTimeout(timerId);
        return {result:"success"};
    }
    return {result:"error",message:"Algorithm isn't started"}
}
function commandHandler(request,sender,sendResponse) {
    switch (request.command){
        case "isStarted":
            sendResponse({result:isStarted});
            break;
        case "start":
            var res=start(request);
            sendResponse(res);
            break;
        case "stop":
            var res=stop(request);
            sendResponse(res);
    }
}


var appManager={
    initialization:function (request) {

  },
    start:function (self) {
        if (self.isError||getDigitsFromString(curMoney.text())<self.min||getDigitsFromString(curMoney.text())>self.max||self.isStopped||self.bet!=getDigitsFromString(inputAmount.val())){
            clearTimeout(timerId);
            isStarted=false;
            if (getDigitsFromString(curMoney.text())<self.min){
                console.log("Ты ушёл в минус, лошара");
                console.log("Ты просрал "+(self.initial_money-getDigitsFromString(curMoney.text()))/100+" рублей");
            }
            if (getDigitsFromString(curMoney.text())>self.max){
                console.log("Тебе повезло, можешь сегодня гульнуть");
                console.log("Комп заработал тебе "+(getDigitsFromString(curMoney.text())-self.initial_money)/100+" рублей");
            }
            if (self.isStopped){
                console.log("Ты нажал на стоп");
                console.log("И заработал "+(getDigitsFromString(curMoney.text())-self.initial_money)/100+" рублей");
            }
            if (self.bet!=getDigitsFromString(inputAmount.val())){
                console.log("Остановлено!");
                console.log("Ошибка обработки ставки")
            }
            if (self.isError){
                console.log("Остановлено!");
                console.log("Случилась не предвиденная ошибка")
            }
            console.log("СТОП");
            console.log("--------------------------------------------------")
        }
        else {
            self[self.algorithm]();
            self.isFirstTime=false;
            timerId=setTimeout(self.manage,self.time,self);
        }
    },
};


var algorithmManager={
    probability:0.5,
    isFirstTime:true,
    isError:false,
    moveButton:"R",
    initial_money:0,
    isStopped:false,
    previous_money:0,
    bet:0,
    min:0,
    max:0,
    time:0,
    algorithm:"",
    data:{},
    initialization:function (request) {
        this.time=1000*60*(+inputMinutes.val())+1000*60*60*(+inputHours.val())+3000;
        this.previous_money=getDigitsFromString(curMoney.text());
        this.algorithm=request.algorithm;
        this.bet=getDigitsFromString(inputAmount.val());
        this.min=getDigitsFromString(curMoney.text())-request.max_damage*100;
        this.max=getDigitsFromString(curMoney.text())+request.max_profit*100;
        this.isStopped=false;
        this.isError=false;
        this.isFirstTime=true;
        this.data={};
        this.initial_money=getDigitsFromString(curMoney.text());
        this.probability=0.5;
        this.hard_chase=hard_chase.initialization(this);
    },
    probable_move:function () {
      if (Math.random()>=this.probability) buttonUp.click();
      else buttonDown.click();
    },
    up_move:function () {
      buttonUp.click();
    },
    down_move:function () {
      buttonDown.click();
    },
    move:function () {
        switch (this.moveButton){
            case "P":
                this.probable_move();
                break;
            case "U":
                this.up_move();
                break;
            case "D":
                this.down_move();
                break;
        }
    },
    refreshBetValue:function () {
        inputAmount.focus();
        if (this.bet<30) this.bet=30;
        port.postMessage({bet:String(this.bet),length:inputAmount.val().length});//make a move in port listener
    },
    hard_chase:null
};

function getDigitsFromString(str) {
    var res="";
    for (var i=0;i<str.length;i++){
        if (isNumeric(str[i])) res+=str[i];
    }
    return +res;
}


function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


var statisticsManager={
    curStat:null,
    setInstance:function (stat) {
      this.curStat=this[stat];
  },
    prepare:function () {
      this.curStat.prepare();
    },
    simpleStat:simpleStat,
};

chrome.runtime.onMessage.addListener(commandHandler);


//----------------ALGORITHMS---------------------


var hard_chase={
  savedBet:30,
  initialization:function (manager) {
      this.savedBet=manager.bet;
      var self=this;
      return function () {
          if (getDigitsFromString(curMoney.text())<this.previous_money){
              this.previous_money=getDigitsFromString(curMoney.text());
              this.bet*=2;
              this.refreshBetValue();
          }
          else if (getDigitsFromString(curMoney.text())>this.previous_money){
              this.previous_money=getDigitsFromString(curMoney.text());
              if (this.bet!=self.savedBet) {
                  this.bet=self.savedBet;
                  this.refreshBetValue();
              }
              else this.move();
          }
          else {
              if (this.isFirstTime) this.move();
              else {
                  this.isError=true;
                  this.time=0;
              }
          }
      }
  }
};




//---------------------STATISTICS--------------------------------------

var simpleStat= {
        prepare: function () {

        }
    }
;