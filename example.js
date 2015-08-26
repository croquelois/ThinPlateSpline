var moment = require('moment');
var fs = require('fs');
var async = require('async');
var PNG = require('pngjs').PNG;
var TPS = require('./tps');
var lambdas = [0,0.25,0.5,1.0,2.0,4.0,8.0,16.0];
var pts2D = [];
var width = 335;
var height = 428;
var nb = Math.floor(width*height*0.01);
var map = {};
for(var i=0;i<nb;i++){
  do{
    var pt = [Math.floor(Math.random()*width),Math.floor(Math.random()*height)];
    var idx = (width * pt[1] + pt[0]) << 2;
  }while(map[idx]);
  map[idx] = true;
  pts2D.push(pt);
}

function test(n,cb){
  fs.createReadStream('Spongebob.png').pipe(new PNG({filterType: 4})).on('parsed', function() {
    var start = moment();
    var width = this.width;
    var height = this.height;
    var data = this.data;
    var yR = [];
    var yG = [];
    var yB = [];
    pts2D.forEach(function(pt){
      var idx = (width * pt[1] + pt[0]) << 2;
      yR.push(data[idx]/255);
      yG.push(data[idx+1]/255);
      yB.push(data[idx+2]/255);
    });
    var tpsR = new TPS(lambdas[n]);
    var tpsG = new TPS(lambdas[n]);
    var tpsB = new TPS(lambdas[n]);
    console.log("Start compile Red: " + moment().format("HH:mm:ss"));
    tpsR.compile(pts2D,yR);
    console.log("Start compile Green: " + moment().format("HH:mm:ss"));
    tpsG.compile(pts2D,yG);
    console.log("Start compile Blue: " + moment().format("HH:mm:ss"));
    tpsB.compile(pts2D,yB);
    console.log("compile finished: " + moment().format("HH:mm:ss"));
    console.log("write pixel in buffer: " + moment().format("HH:mm:ss"));
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var idx = (width * y + x) << 2;
        data[idx] = Math.max(0,Math.min(255,Math.floor(tpsR.getValue([x,y])*255)));
        data[idx+1] = Math.max(0,Math.min(255,Math.floor(tpsG.getValue([x,y])*255)));
        data[idx+2] = Math.max(0,Math.min(255,Math.floor(tpsB.getValue([x,y])*255)));
      }
    }
    console.log("encode buffer and write file: " + moment().format("HH:mm:ss"));
    console.log("compute time:" + ((moment()-start)/1000).toFixed(2));
    this.pack().pipe(fs.createWriteStream('out'+n+'.png').on('finish',cb));
  });
}

async.forEach(lambdas.map(function(l,i){return i;}),test,function(){});