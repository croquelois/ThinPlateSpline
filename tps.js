"use strict";
var numeric = require('numeric');
var ln = Math.log;
var sqrt = Math.sqrt;

var kernel = function(pt1, pt2){
  var r2 = 0;
  for(var i=0;i<pt1.length;i++){
    var t = pt1[i]-pt2[i];
    r2 += t*t;
  }
  if(!r2) return 0;
  return 0.5*r2*ln(r2);
};

function TPS(lambda){
  this.pts = [];
  this.ws = [];
  this.ys = [];
  this.alpha = 0;
  this.lambda = lambda||0;
}

TPS.prototype.compile = function(pts, ys){
  if(!pts || !pts.length) 
    throw new Error('incorrect input (points list empty or null');
  if(pts.length != ys.length)
    throw new Error('points list length and y list length are different');
  var dim = pts[0].length;
  if(!pts.every(function(pt){ return pt.length == dim; }))
    throw new Error('points must have same dimensions');
  this.ws = [];
  this.pts = pts.slice(0);
  this.ys = ys = ys.slice(0);
  
  var alpha = 0;
  pts.forEach(function(pt1){
    pts.forEach(function(pt2){
      var r2 = 0;
      for(var i=0;i<dim;i++){
        var t = pt1[i]-pt2[i];
        r2 += t*t;
      }
      alpha += sqrt(r2);
    });
  });
  this.alpha = alpha/(pts.length*pts.length);
  
  var P = pts.map(function(pt){ return [1].concat(pt); });
  var matrix = [], matRow = [], pRow = [];
  for(var i=0;i<pts.length;i++){
    matRow = [];
    for(var j=0;j<pts.length;j++)
      matRow.push(kernel(pts[i], pts[j]));
    matRow[i] += this.alpha*this.lambda;
    matrix.push(matRow.concat([1],pts[i]));
  }
  var newRows = numeric.transpose(P).map(function(row){
    return matrix[0].map(function(r,i){ return row[i]||0; });
  });
  newRows.forEach(function(row){
    matrix.push(row);
    ys.push(0);
  },this);
  this.ws = numeric.solve(matrix, ys);
  if(!this.ws) throw new Error('failed to compile with given points');
};

TPS.prototype.getValue = function(p){
  var result = 0, i = 0;
  this.pts.forEach(function(pt,i){
    result += this.ws[i]*kernel(p, pt);
  },this);
  result += this.ws[this.pts.length];
  for(i=0;i<p.length;i++)
    result += this.ws[this.pts.length+(i+1)]*p[i];
  return result;
};

TPS.prototype.getValues = function(ps){
  return ps.map(this.getValue.bind(this));
};

module.exports = TPS;