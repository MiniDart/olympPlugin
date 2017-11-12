var port;
chrome.runtime.onConnect.addListener((p)=>{
   port=p;
   port.onMessage.addListener((msg)=>{
       $.ajax({
           url:"http://localhost:8080/",
           headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json'
           },
           type:"POST",
           dataType:"json",
           data:JSON.stringify(msg),
           success:(resp)=>{
               port.postMessage(resp);
           }
       });
   })
});