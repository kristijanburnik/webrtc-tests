
// the main object
var t = {
  _loadAudioBuffer:function(url, context , callback) {
      trace("load audio buffer");
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      request.onload = function(oEvent) {
        trace("onload");
        context.decodeAudioData(request.response, function (decodedAudio) {
          trace("decode audio data");
          callback( decodedAudio );
        });
      }
      request.send(null);
  },
  
  _audioContext:null,
  getAudioContext:function(){
    if ( ! t._audioContext  )
        t._audioContext = new AudioContext();
    
    return t._audioContext;
  },
  
  _mediaStreamDestination:null,
  getMediaStreamDestination:function(){      
    if ( ! t._mediaStreamDestination )  
      t._mediaStreamDestination = t.getAudioContext().createMediaStreamDestination();
      
    return t._mediaStreamDestination;
    
  },
  
  streamAudioFile:function( url , callback ){
  
      t._mediaStreamDestination = t.getMediaStreamDestination();
      
      var context = t.getAudioContext();
      
      t._loadAudioBuffer( url , context , function(voiceSoundBuffer) {
        
        var voiceSound = context.createBufferSource();
        voiceSound.buffer = voiceSoundBuffer;        
        voiceSound.connect( t._mediaStreamDestination );        
        voiceSound.start(0);

        // set the media stream
        callback( t._mediaStreamDestination.stream );

      });

     return t;

   },

}

window.onload = function() {

  var localStream, localPeerConnection, remotePeerConnection;

  function handleError(e){
    console.error(e);
  }

  function gotStream(stream){
    trace("Received local stream");
    localVideo.src = URL.createObjectURL(stream);
    localStream = stream;
    callButton.disabled = false;
  }

  function start() {
    trace("Requesting local stream");
    startButton.disabled = true;
    getUserMedia({audio:true, video:true}, gotStream,
      function(error) {
        trace("getUserMedia error: ", error);
      });
  }

  function gotLocalDescription(description){
    localPeerConnection.setLocalDescription(description);
    trace("Offer from localPeerConnection: \n" + description.sdp);
    remotePeerConnection.setRemoteDescription(description);
    remotePeerConnection.createAnswer(gotRemoteDescription,handleError);
  }

  function gotRemoteDescription(description){
    remotePeerConnection.setLocalDescription(description);
    trace("Answer from remotePeerConnection: \n" + description.sdp);
    localPeerConnection.setRemoteDescription(description);
  }


  // for receiveing the stream over network
  function gotRemoteStream(event){
    remoteVideo.src = URL.createObjectURL(event.stream);
    trace("Received remote stream");
  }

  function gotLocalIceCandidate(event){
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
      trace("Local ICE candidate: \n" + event.candidate.candidate);
    }
  }

  function gotRemoteIceCandidate(event){
    if (event.candidate) {
      localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
      trace("Remote ICE candidate: \n " + event.candidate.candidate);
    }
  }
  
  // main: 
  
  var url = "sample.wav";
  
  // get the stream from file and establish a peer connection
  t.streamAudioFile( url , function( localStream ) {
    var servers = null;

    localPeerConnection = new RTCPeerConnection(servers);
    trace("Created local peer connection object localPeerConnection");
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    remotePeerConnection = new RTCPeerConnection(servers);
    trace("Created remote peer connection object remotePeerConnection");
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    remotePeerConnection.onaddstream = gotRemoteStream; // the magic on remote

    // provide stream to the remote side
    localPeerConnection.addStream( localStream );
    trace("Added localStream to localPeerConnection");
    localPeerConnection.createOffer(gotLocalDescription,handleError);
  });
  
}
