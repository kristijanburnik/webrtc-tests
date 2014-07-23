

$(function(){

    function takePhoto( video ) {
        var photo = $('#photo')[0];
        var context = photo.getContext('2d');
     
        photo.width = video.clientWidth;
        photo.height = video.clientHeight;
     
        context.drawImage(video, 0, 0, photo.width, photo.height);
        
        var imgData=context.getImageData( 0, 0, 50, 50 );
        
        var out = "";
        for (var x in imgData.data) {
          out+= imgData.data[x]+";";
        }
        // console.log(imgData.data);
        // console.log(out);
        $.post("./store.image.data.php",{data:out},function(r){ console.log("server responded") });        
    }



  var fullMediaRequest = function() {
  getUserMedia( 
    { audio:true , video:true } , 
    function( stream ){
   
    
      var videoSinkEl = $("#vid")[0];
      videoSinkEl.autoplay = true;
      attachMediaStream( videoSinkEl ,stream );
      
      setTimeout(function(){
        console.log("Snap");
        takePhoto( videoSinkEl );
      },1000);
      
      // console.log( stream );
    },
    function( e ){
    
    }
   )   
  }
  
  setInterval( fullMediaRequest , 5000 );
  fullMediaRequest();


});
