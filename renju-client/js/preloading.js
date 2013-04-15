(function(global){

  function PreloaderController(num){
    this.loader = new PxLoader(),
    this.urls = ['img/avatars.png',
            'img/boke.jpg',
            'img/ch-front.jpg',
            'img/ch-side.png',
            'img/ch-top.png',
            'img/front.jpg',
            'img/grass.jpg',
            'img/house-0.jpg',
            'img/tiles.jpg'],
    this.query = this.urls.length,
    this.loaded = 0;

    for(var i=0;i<this.query;i++){
      this.loader.addImage(this.urls[i]);
    }

    this.loader.addProgressListener($.proxy(this.fileLoaded,this));
    this.loader.addCompletionListener($.proxy(this.queryComplete,this));
    this.loader.start();
  }

  PreloaderController.prototype.fileLoaded = function(event){
    this.loaded++;
    document.getElementById('loaded').style.width = Math.floor(100*this.loaded/this.query)+"%";
  };

  PreloaderController.prototype.queryComplete = function(){
    $('.start-screen').show();
    $('.loading-screen').fadeOut();
  };


  function onDomReady(){
    new PreloaderController;
  }

  $(document).ready(onDomReady);
})(this)