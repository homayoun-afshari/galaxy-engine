const Projectile = class {
	constructor(data) {
		let mass = data.hasOwnProperty('mass') ? Projectile.bound('mass', data.mass) : Projectile.randomizer('mass');
		let velocity = (data.hasOwnProperty('velocityX') && data.hasOwnProperty('velocityY')) ? Projectile.bound('velocity', [data.velocityX, data.velocityY]) : Projectile.randomizer('velocity');
		let trajectory = 'M '+data.positionX.toFixed(2)+' '+data.positionY.toFixed(2);
		this.isRemoved = data.hasOwnProperty('isRemoved') ? Projectile.bound('isRemoved', data.isRemoved) : false;
		this.isExplosive = data.hasOwnProperty('isExplosive') ? Projectile.bound('isExplosive', data.isExplosive) : true;
		this.name = data.hasOwnProperty('name') ? Projectile.bound('name', data.name) : Projectile.randomizer('name');
		this.material = data.hasOwnProperty('material') ? Projectile.bound('material', data.material) : Projectile.randomizer('material');
		this.mass = mass;
		this.radius = Projectile.massToRadius(mass);
		this.temperature = data.hasOwnProperty('temperature') ? Projectile.bound('temperature', data.temperature) : Projectile.randomizer('temperature');
		this.velocityX = velocity[0];
		this.velocityY = velocity[1];
		this.positionX = data.positionX;
		this.positionY = data.positionY;
		this.trajectory = trajectory;
		this.stepCounter = trajectory.split('L').length;
	}
	static randomizer(key) {
		switch(key) {
			case 'name':
				return 'mass_'+(Array.from({'length': 5}, () => initials.alphabet[(Math.random()*(initials.alphabet.length - 1)).toFixed()]).join(''));
			case 'material':
				return (Math.random()*(initials.palette.length - 1)).toFixed()*1;
			case 'mass':
				return initials.sldMassLimits[1] + Math.random()*(initials.sldMassLimits[2] - initials.sldMassLimits[1]);
			case 'temperature':
				return initials.sldTemperatureLimits[1] + Math.random()*(initials.sldTemperatureLimits[2] - initials.sldTemperatureLimits[1]);
			case 'velocity':
				let speed = Math.sqrt(Math.pow(initials.sldSpeedLimits[1], 2) + Math.random()*(Math.pow(initials.sldSpeedLimits[2], 2) - Math.pow(initials.sldSpeedLimits[1], 2)));
				let direction = initials.sldDirectionLimits[1] + Math.random()*(initials.sldDirectionLimits[2] - initials.sldDirectionLimits[1]);
				return [speed*Math.cos(direction), speed*Math.sin(direction)];
		}
	}
	static bound(key, value) {
		switch(key) {
			case 'isRemoved':
				value = value > 0;
				break;
			case 'isExplosive':
				value = value > 0;
				break;
			case 'name':
				value = value.toString();
				if (value.length === 0) {
					value = Projectile.randomizer('name');
				}
				break;
			case 'material':
				if ((value < 0) || (value > initials.palette.length - 1)) {
					value = Projectile.randomizer('material');
				}
				break;
			case 'mass':
				if (value < initials.sldMassLimits[0]) {
					value = initials.sldMassLimits[0];
				}
				if (value > initials.sldMassLimits[3]) {
					value = initials.sldMassLimits[3];
				}
				break;
			case 'temperature':
				if (value < initials.sldTemperatureLimits[0]) {
					value = initials.sldTemperatureLimits[0];
				}
				if (value > initials.sldTemperatureLimits[3]) {
					value = initials.sldTemperatureLimits[3];
				}
				break;
			case 'speed':
				if (value < initials.sldSpeedLimits[0]) {
					value = initials.sldSpeedLimits[0];
				}
				if (value > initials.sldSpeedLimits[3]) {
					value = initials.sldSpeedLimits[3];
				}
				break;
			case 'velocity':
				let speedOld = Math.sqrt(Math.pow(value[0], 2) + Math.pow(value[1], 2));
				let speed = Projectile.bound('speed', speedOld);
				value[0] = value[0]*speed/speedOld;
				value[1] = value[1]*speed/speedOld;
		}
		return value;
	}
	static check(data) {
		if (!data.hasOwnProperty('isRemoved')) {
			return false;
		} else if (!data.hasOwnProperty('isExplosive')) {
			return false;
		} else if (!data.hasOwnProperty('name')) {
			return false;
		} else if (!data.hasOwnProperty('material') || isNaN(data.material)) {
			return false;
		} else if (!data.hasOwnProperty('mass') || isNaN(data.mass)) {
			return false;
		} else if (!data.hasOwnProperty('temperature') || isNaN(data.temperature)) {
			return false;
		} else if (!data.hasOwnProperty('velocityX') || !data.hasOwnProperty('velocityY') || isNaN(data.velocityX) || isNaN(data.velocityY)) {
			return false;
		} else if (!data.hasOwnProperty('positionX') || !data.hasOwnProperty('positionY') || isNaN(data.positionX) || isNaN(data.positionY)) {
			return false;
		}
		return true;
	}
	static massToRadius(mass){
		let delta = initials.sldMassLimits[2];
		let limit;
		if (mass < delta) {
			limit = initials.sldMassLimits[0];
		} else {
			limit = initials.sldMassLimits[3]
		}
		let A = -(initials.sldRadiusLimits[3] - initials.sldRadiusLimits[0])/Math.pow(limit - delta, 2);
		let B = -2*delta*A;
		let C = Math.pow(delta, 2)*A + initials.sldRadiusLimits[3];
		return A*Math.pow(mass, 2) + B*mass + C;
	}
};
let galaxy = {
	isPaused: true,
	hasExplosion: true,
	originIndex: null,
	originX: null,
	originY: null,
	rate: null,
	total: 0,
	projectileS: [],
	add: function(projectile) {
		this.total++;
		this.projectileS[this.projectileS.length] = new Projectile(projectile);
	},
	remove: function(index) {
		if (this.originIndex === index) {
			this.setOrigin(null);
		}
		this.projectileS[index].isRemoved = true;
	},
	clean: function() {
		for (let i = 0; i < this.projectileS.length; i++) {
			if (this.projectileS[i] === null) continue;
			if (this.projectileS[i].isRemoved) {
				this.total--;
				this.projectileS[i] = null;
			}
		} 
	},
	restart: function() {
		this.toggleExplosion(true);
		this.setOrigin(null);
		this.total = 0;
		this.projectileS = [];
	},
	load: function(dataDecoded) {
		let hasExplosion;
		let originIndex = null;
		let total = 0;
		if (!dataDecoded.hasOwnProperty('hasExplosion')) {
			return false;
		} else if (!dataDecoded.hasOwnProperty('originIndex') || !dataDecoded.hasOwnProperty('originIndex')) {
			return false;
		} else if (!dataDecoded.hasOwnProperty('projectileS')) {
			return false;
		}
		hasExplosion = dataDecoded.hasExplosion > 0;
		for (let i = 0; i < dataDecoded.projectileS.length; i++) {
			if (dataDecoded.projectileS[i] === null) {
				continue;
			}
			if ((originIndex === null) && (i === dataDecoded.originIndex)) {
				originIndex = i;
			}
			if (!Projectile.check(dataDecoded.projectileS[i])) {
				return false;
			}
			total++;
		}
		this.total = total;
		this.projectileS = new Array(dataDecoded.projectileS.length);
		for (let i = 0; i < dataDecoded.projectileS.length; i++) {
			if (dataDecoded.projectileS[i] === null) {
				this.projectileS[i] = null;
			} else {
				this.projectileS[i] = new Projectile(dataDecoded.projectileS[i]);
			}
		}
		this.toggleExplosion(hasExplosion);
		this.setOrigin(originIndex);
		return true;
	},
	save: function() {
		let dataS = new Array(this.projectileS.length);
		for (let i = 0; i < this.projectileS.length; i++) {
			if (this.projectileS[i] === null) {
				dataS[i]= null;
			} else {
				dataS[i]= {
					isRemoved: this.projectileS[i].isRemoved,
					isExplosive: this.projectileS[i].isExplosive,
					name: this.projectileS[i].name,
					material: this.projectileS[i].material,
					mass: this.projectileS[i].mass,
					temperature: this.projectileS[i].temperature,
					velocityX: this.projectileS[i].velocityX,
					velocityY: this.projectileS[i].velocityY,
					positionX: this.projectileS[i].positionX,
					positionY: this.projectileS[i].positionY,
				};
			}
		}
		return JSON.stringify({
			hasExplosion: galaxy.hasExplosion,
			originIndex: galaxy.originIndex,
			projectileS: dataS
		});
	},
	roll: function(state) {
		if (state) {
			this.isPaused = false;
			this.setOrigin();
			return physics();
		} else {
			this.isPaused = true;
		}
	},
	toggleExplosion: function(state=!this.hasExplosion) {
		this.hasExplosion = state;
	},
	setOrigin: function(index=this.originIndex) {
		if (index === null) {
			this.originIndex = null;
		} else {
			this.originIndex = index;
			this.originX = this.projectileS[index].positionX;
			this.originY = this.projectileS[index].positionY;
		}
	},
	shift: function(destinationX, destinationY) {
		let centerX = 0;
		let centerY = 0;
		let counter = 0;
		for (let i = 0; i < galaxy.projectileS.length; i++) {
			if (galaxy.projectileS[i] === null) continue;
			centerX += galaxy.projectileS[i].positionX;
			centerY += galaxy.projectileS[i].positionY;
			counter++;
		}
		if (counter === 0) {
			return;
		}
		centerX /= counter;
		centerY /= counter;
		for (let i = 0; i < galaxy.projectileS.length; i++) {
			if (galaxy.projectileS[i] === null) continue;
			let positionX = galaxy.projectileS[i].positionX + destinationX - centerX;
			let positionY = galaxy.projectileS[i].positionY + destinationY - centerY;
			let trajectory = 'M '+positionX.toFixed(2)+' '+positionY.toFixed(2);
			galaxy.projectileS[i].positionX = positionX;
			galaxy.projectileS[i].positionY = positionY;
			galaxy.projectileS[i].trajectory = trajectory;
			galaxy.projectileS[i].stepCounter = trajectory.split('L').length;
		}
	},
	setRate: function(value) {
		this.rate = value;
	},
	traject: function(index) {
		this.projectileS[index].trajectory = this.projectileS[index].trajectory+' L '+this.projectileS[index].positionX.toFixed(2)+' '+this.projectileS[index].positionY.toFixed(2);
		this.projectileS[index].stepCounter++;
		if (this.projectileS[index].stepCounter > initials.stepTotal) {
			this.projectileS[index].trajectory = 'M'+this.projectileS[index].trajectory.slice(this.projectileS[index].trajectory.indexOf('L') + 1);
			this.projectileS[index].stepCounter = initials.stepTotal;
		}
	}

}

function physics () {
	return new Promise(function(resolve) {
		const loop = function() {
			//initialization
			let startTime = new Date().getTime();
			let period = galaxy.rate*initials.frameDuration/1000;
			let duration;
			let speedS = new Array(galaxy.projectileS.length).fill(0);
			let distanceS = new Array(galaxy.projectileS.length);
			for (let i = 0; i < distanceS.length; i++) {
				distanceS[i] = new Array(galaxy.projectileS.length).fill(Infinity);
			}
			//calculation
			let positionXS = new Array(galaxy.projectileS.length).fill(0);
			let positionYS = new Array(galaxy.projectileS.length).fill(0);
			for (let i = 0; i < galaxy.projectileS.length; i++) {
				if (galaxy.projectileS[i] === null) continue;
				positionXS[i] = galaxy.projectileS[i].positionX;
				positionYS[i] = galaxy.projectileS[i].positionY;
			}
			for (let i = 0; i < galaxy.projectileS.length; i++) {
				if (galaxy.projectileS[i] === null) continue;
				let accelerationX = 0;
				let accelerationY = 0;
				let velocityX = 0;
				let velocityY = 0;
				let speed = 0;
				for (let j = 0; j < galaxy.projectileS.length; j++) {
					if ((galaxy.projectileS[j] === null) || (i === j)) continue;
					let distanceX = galaxy.projectileS[j].positionX - galaxy.projectileS[i].positionX;
					let distanceY = galaxy.projectileS[j].positionY - galaxy.projectileS[i].positionY;
					let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
					let temp = (initials.gravitationalConstantThirdRoot*galaxy.projectileS[i].mass/distance)*(initials.gravitationalConstantThirdRoot*galaxy.projectileS[j].mass/distance);
					accelerationX += temp*(initials.gravitationalConstantThirdRoot*distanceX/distance);
					accelerationY += temp*(initials.gravitationalConstantThirdRoot*distanceY/distance);
					distanceS[i][j] = distance;
				}
				velocityX = accelerationX*period + galaxy.projectileS[i].velocityX;
				velocityY = accelerationY*period + galaxy.projectileS[i].velocityY;
				speed = Math.sqrt(Math.pow(velocityX, 2) + Math.pow(velocityY, 2));
				speedS[i] = Projectile.bound('speed', speed);
				galaxy.projectileS[i].velocityX = velocityX*speed/speedS[i];
				galaxy.projectileS[i].velocityY = velocityY*speed/speedS[i];
				positionXS[i] = galaxy.projectileS[i].velocityX*period + galaxy.projectileS[i].positionX;
				positionYS[i] = galaxy.projectileS[i].velocityY*period + galaxy.projectileS[i].positionY;
			}
			for (let i = 0; i < galaxy.projectileS.length; i++) {
				if (galaxy.projectileS[i] === null) continue;
				galaxy.projectileS[i].positionX = positionXS[i];
				galaxy.projectileS[i].positionY = positionYS[i];
			}
			//center
			if (galaxy.originIndex !== null) {
				let displacementX = galaxy.originX - galaxy.projectileS[galaxy.originIndex].positionX;
				let displacementY = galaxy.originY - galaxy.projectileS[galaxy.originIndex].positionY;
				for (let i = 0; i < galaxy.projectileS.length; i++) {
					if (galaxy.projectileS[i] === null) continue;
					galaxy.projectileS[i].positionX += displacementX;
					galaxy.projectileS[i].positionY += displacementY;
				}
			}
			//collision
			let hasCollisionS =  new Array(galaxy.projectileS.length).fill(false);
			let energyS = new Array(galaxy.projectileS.length).fill(0);
			let massS = new Array(galaxy.projectileS.length).fill(0);
			let momentumXS = new Array(galaxy.projectileS.length).fill(0);
			let momentumYS = new Array(galaxy.projectileS.length).fill(0);
			let centerXS = new Array(galaxy.projectileS.length).fill(0);
			let centerYS = new Array(galaxy.projectileS.length).fill(0);
			for (let i = 0; i < distanceS.length; i++) {
				if (galaxy.projectileS[i] === null) continue;
				for (let j = 0; j < distanceS.length; j++) {
					if ((galaxy.projectileS[j] === null) || (i === j)) continue;
					if (distanceS[i][j] < galaxy.projectileS[i].radius + galaxy.projectileS[j].radius) {
						hasCollisionS[i] = true;
						energyS[i] += 0.255*(galaxy.projectileS[i].mass*Math.pow(speedS[i], 2) + galaxy.projectileS[j].mass*Math.pow(speedS[j], 2));
						momentumXS[i] += 0.5*(galaxy.projectileS[i].mass*galaxy.projectileS[i].velocityX + galaxy.projectileS[j].mass*galaxy.projectileS[j].velocityX);
						momentumYS[i] += 0.5*(galaxy.projectileS[i].mass*galaxy.projectileS[i].velocityY + galaxy.projectileS[j].mass*galaxy.projectileS[j].velocityY);
					}
				}
			}
			for (let i = 0; i < hasCollisionS.length; i++) {
				if ((galaxy.projectileS[i] === null) || !hasCollisionS[i]) continue;
				for (let j = 0; j < hasCollisionS.length; j++) {
					if ((galaxy.projectileS[j] === null) || (i === j) || !hasCollisionS[j]) continue;
					 //if (!galaxy.projectileS[i].isExplosive || !galaxy.projectileS[j].isExplosive) {
					let indexRemoved;
					let indexKept;
					if (galaxy.projectileS[i].mass < galaxy.projectileS[j].mass) {
						indexRemoved = i;
						indexKept = j;
					} else {
						indexRemoved = j;
						indexKept = i;
					}
					hasCollisionS[indexRemoved] = false;
					energyS[indexKept] += energyS[indexRemoved];
					massS[indexRemoved] = 0;
					massS[indexKept] = galaxy.projectileS[i].mass + galaxy.projectileS[j].mass;
					momentumXS[indexKept] += momentumXS[indexRemoved];
					momentumYS[indexKept] += momentumYS[indexRemoved];
					centerXS[indexKept] = (galaxy.projectileS[indexRemoved].mass*galaxy.projectileS[indexRemoved].positionX + galaxy.projectileS[indexKept].mass*galaxy.projectileS[indexKept].positionX)/massS[indexKept];
					centerYS[indexKept] = (galaxy.projectileS[indexRemoved].mass*galaxy.projectileS[indexRemoved].positionY + galaxy.projectileS[indexKept].mass*galaxy.projectileS[indexKept].positionY)/massS[indexKept];
					mainProfile.remove(i);
					mainProfile.remove(j);
					if (indexRemoved === i) {
						break;
					}
				}
			}
			for (let i = 0; i < hasCollisionS.length; i++) {
				if ((galaxy.projectileS[i] === null) || !hasCollisionS[i]) continue;
				let mass = Projectile.bound('mass', massS[i]);
				galaxy.add({
					material: galaxy.projectileS[i].material,
					mass: mass,
					radius: Projectile.massToRadius(massS[i]),
					velocityX: momentumXS[i]/massS[i],
					velocityY: momentumYS[i]/massS[i],
					positionX: centerXS[i],
					positionY: centerYS[i]
				});
				mainProfile.add();
				downloadData(galaxy.projectileS.length - 1);
			}
			//move
			for (let i = 0; i < galaxy.projectileS.length; i++) {
				if (galaxy.projectileS[i] === null) continue;
				galaxy.traject(i);
				move(i, galaxy.projectileS[i].positionY, galaxy.projectileS[i].positionX, galaxy.projectileS[i].radius);
				traject(i, galaxy.projectileS[i].trajectory);
			}
			if (selectProfile.isActive) {
				downloadData();
			}
			//clean
			galaxy.clean();
			if (galaxy.total === 0) {
				mainProfile.roll(false);
			}
			//next frame
			duration = new Date().getTime() - startTime;
			setTimeout(function() {
				if (galaxy.isPaused) {
					resolve();
				} else {
					loop();
				}
			}, initials.frameDuration - duration);
		};
		loop();
	});
}
