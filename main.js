const { Architect, Neuron, Layer, Network, Trainer } = synaptic;
const canvas = document.getElementById('demo');
const graphs = {
  fuel: document.getElementById('graph-fuel'),
  velocity: document.getElementById('graph-velocity'),
  totalCost: document.getElementById('graph-total-cost')
};

const images = {
  rocket: createImage('images/rocket.png'),
  fire: createImage('images/fire.png'),
  rocketCrash: createImage('images/rocket-crash.png'),
};

const ctx = canvas.getContext('2d');
const keysDown = {};
const log = [];

let rockets = [];
let shouldRender = true;
let round = 0;
