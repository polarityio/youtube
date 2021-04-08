'use strict';

polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  init: function(){
    this._super('...arguments');
    const firstVideo = this.get('details.0');
    this.set('selectedVideo', firstVideo);
  },
  actions: {
    selectVideo: function(video){
      this.set('selectedVideo', video);
    },
    hoverVideo: function(video){
      this.set('highlightedVideo', video);
    },
    unhoverVideo: function(video){
      this.set('highlightedVideo', undefined);
    }
  }
});
