// == Black magic ahead == //

// do not use this for encryption!
function genrandom(seed) {
  var z = 987654321;
  return function() {
    z = (36969 * (z & 65535) + (z >> 16)) & 0xffffffff;
    seed = (18000 * (seed & 65535) + (seed >> 16)) & 0xffffffff;
    var result = ((z << 16) + seed) & 0xffffffff;
    result /= 4294967296;
    return result + 0.5;
  }
};

// == White magic ahead == //

var tau = 2 * Math.PI;
var random = genrandom(123456789);

function mod(a, b) {
  return ((a % b) + b) % b;
}

function interval(n) {
  return Math.pow(2, n / 12);
}

// == Class == //

function String(rate, freq) {
  this.rate = rate;
  this.freq = freq;
  // this.decay = decay;
  // this.base = base;
  // this.harmonics = harmonics;

  this.fret = 0; // open

  this.len = Math.floor(rate / freq) + 1; // should be enough
  this.wavetable = new Array(this.len);
  for(var i = this.len; i--;) {
    var out = 0;
    var norm = 0;
    norm += 5; out += 5 * Math.sin(tau / (rate / freq) * i);
    norm += 3; out += 3 * Math.sin(tau / (rate / freq) * 2 * i);
    norm += 2; out += 2 * Math.sin(tau / (rate / freq) * 3 * i);
    norm += 1; out += 1 * (random() * 2 - 1);
    this.wavetable[i] = out / norm;
  }
  this.pointer = 0;
}

// hammer-on and pull-off
String.prototype.slur = function(fret, vel) {
};

String.prototype.pluck = function(fret, vel) {
};

// @TODO: implement attack/release
// @TODO: implement fretted mute/unmute
// @TODO: implement harmonics
// @TODO: implement slide
// @TODO: implement resonator

String.prototype.ar = function() {
  var delay = this.rate / this.freq;

  var len = this.len;
  var o = mod(this.pointer - delay, len);
  var ro = Math.round(o);
  var oo = o - ro;

  var i2 = mod(ro, len);
  var i1 = mod(i2 - 1, len);
  var i3 = mod(i2 + 1, len);

  var s1 = this.wavetable[i1];
  var s2 = this.wavetable[i2];
  var s3 = this.wavetable[i3];

  // var ts1 = s1 * (0.5 + oo - 1) * (0.5 + oo - 2) / (0 - 1) / (0 - 2)
  //         + s2 * (0.5 + oo - 0) * (0.5 + oo - 2) / (1 - 0) / (1 - 2)
  //         + s2 * (0.5 + oo - 0) * (0.5 + oo - 1) / (2 - 0) / (2 - 1);

  // var ts2 = s1 * (1.5 + oo - 1) * (1.5 + oo - 2) / (0 - 1) / (0 - 2)
  //         + s2 * (1.5 + oo - 0) * (1.5 + oo - 2) / (1 - 0) / (1 - 2)
  //         + s2 * (1.5 + oo - 0) * (1.5 + oo - 1) / (2 - 0) / (2 - 1);

  var ts1 = s1 * (oo - 0.5) * (oo - 1.5) / 2
          + s2 * (oo + 0.5) * (oo - 1.5) / -1
          + s2 * (oo + 0.5) * (oo - 0.5) / 2;

  var ts2 = s1 * (oo + 0.5) * (oo - 0.5) / 2
          + s2 * (oo + 1.5) * (oo - 0.5) / -1
          + s2 * (oo + 1.5) * (oo + 0.5) / 2;

  var out = (0.5 * ts1 + 0.5 * ts2) * 0.996;
  this.wavetable[this.pointer] = out;
  this.pointer = mod(this.pointer + 1, len);
  
  return out;
};

var string1 = new String(sampleRate, 220);
var string2 = new String(sampleRate, 220 * interval(7));

export function dsp(t) {
  var norm = 0;
  var out = 0;

  norm += 1; out += 1 * string1.ar();
  norm += 1; out += 1 * string2.ar();

  return out / (norm || 1);
}