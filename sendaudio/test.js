var local, remote, stream;

// the object used to wrap getting the audio from a file to a stream
var t = {

  // singleton instances
  _audioContext:null,
  _mediaStreamDestination:null,

  // loads a wave file from an url and decodes it
  _loadAudioBuffer:function(url, context , callback) {
      trace("load audio buffer");
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function(oEvent) {
        context.decodeAudioData(request.response, function (decodedAudio) {
          trace("decode audio data");
          callback( decodedAudio );
        });
      }
      request.send(null);
  },

  // provides a singleton for |AudioContext|
  _getAudioContext:function(){
    if ( ! t._audioContext  )
        t._audioContext = new AudioContext();
    return t._audioContext;
  },


  // provides a singleton media stream destination
  _getMediaStreamDestination:function(){
    if ( ! t._mediaStreamDestination )
      t._mediaStreamDestination =
        t._getAudioContext().createMediaStreamDestination();
    return t._mediaStreamDestination;
  },

  ////////////////////////////////////////////////////////////////////////

  // loads audio file from url, decodes it and
  // returns the media stream with audio attached via callback
  streamAudioFile:function( url , callback , onStopCallback ) {

      onStopCallback = onStopCallback || function( event, stream ) {
        console.warn("No onStopCallback provided for streamAudioFile");
      };

      var context = t._getAudioContext();

      t._loadAudioBuffer( url , context , function(decodedAudio) {

        // get a media stream destination for attaching
        var mediaStreamDestination = t._getMediaStreamDestination();

        // attach an |AudioBufferSourceNode| to the decoded audio file
        // the SourceNode will then provide data
        // to the stream |mediaStreamDestination|
        var voiceSound = context.createBufferSource();
        voiceSound.buffer = decodedAudio;
        voiceSound.connect( mediaStreamDestination );

        voiceSound.onended = function(e) {
          onStopCallback( e, mediaStreamDestination.stream );
        }

        console.log("Context", context);
        console.log("Voice" , voiceSound);

        voiceSound.start(0);

        // return the the media stream to caller via callback
        callback( mediaStreamDestination.stream );

      });

     return t;

   } // streamAudioFile

}; // t

////////////////////////////////////////////////////////////////////////////////

window.onload = function() {

  //////////////////////////////////////////////////////////////////////////////
  // RTCPeerConnection BOILER PLATE

  var localStream, localPeerConnection, remotePeerConnection;

  function handleError(e){ console.error(e); }

  function gotStream(stream){
    trace("Received local stream");
    localVideo.src = URL.createObjectURL(stream);
    localStream = stream;
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

  function gotLocalIceCandidate(event){
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(
        new RTCIceCandidate(event.candidate)
      );
      trace("Local ICE candidate: \n" + event.candidate.candidate);
    }
  }

  function gotRemoteIceCandidate(event){
    if (event.candidate) {
      localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
      trace("Remote ICE candidate: \n " + event.candidate.candidate);
    }
  }
  // end: RTCPeerConnection BOILER PLATE
  //////////////////////////////////////////////////////////////////////////////

  // for receiveing the stream over network --> attach to a <video> element
  function gotRemoteStream(event){
    var remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.src = URL.createObjectURL(event.stream);
  }

  // MAIN //////////////////////////////////////////////////////////////////////

  var url = "sample.wav";

  // get the stream from file and establish a peer connection
  t.streamAudioFile( url , function( localStream ) { // OnStartCallback
    var servers = null;

    stream = localStream;
    console.log(localStream);

    local = localPeerConnection = new RTCPeerConnection(servers);
    trace("Created local peer connection object localPeerConnection");
    localPeerConnection.onicecandidate = gotLocalIceCandidate;

    remote = remotePeerConnection = new RTCPeerConnection(servers);
    trace("Created remote peer connection object remotePeerConnection");
    remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
    remotePeerConnection.onaddstream = gotRemoteStream; // the magic on remote

    // attach locally to provide the stream to the remote side
    localPeerConnection.addStream( localStream );
    trace("Added localStream to localPeerConnection");
    localPeerConnection.createOffer(gotLocalDescription, handleError);
  } , function( event, localStream ) { // OnStoppedCallback
      // local track stopped.
    console.info("It stopped!");
  });
}
