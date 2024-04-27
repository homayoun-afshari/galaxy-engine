let mainProfile = {
	promise: null,
	total: 0,
	targetGalaxy: null,
	targetProjectileS: null,
	targetTrajectoryS: null,
	currentData: {},
	currentBackup: {},
	add: function() {
		let elmProjectile;
		let elmSvg;
		elmProjectile = this.targetGalaxy.sampleProjectile.cloneNode(true);
		elmProjectile.index = this.targetProjectileS.length;
		elmProjectile.addEventListener('mousedown', function(event) {
			selectProfile.activate(this.index);
			if (galaxy.isPaused) {
				let rectGalaxy = mainProfile.targetGalaxy.getBoundingClientRect();
				let rectProjectile = this.getBoundingClientRect();
				dragProfile.activate('projectile', null, (rectProjectile.top - rectGalaxy.top)/scaleProfile.scale, (rectProjectile.left - rectGalaxy.left)/scaleProfile.scale, event.clientY, event.clientX, scaleProfile.scale);
			}
			event.stopPropagation();
			toggleIdleness(true);
		});
		elmSvg = this.targetGalaxy.sampleSvg.cloneNode(true);
		this.total++;
		this.targetGalaxy.append(elmProjectile);
		this.targetGalaxy.append(elmSvg);
	},
	remove: function(index=selectProfile.indexProjectile) {
		galaxy.remove(index);
		this.total--;
		this.targetProjectileS[index].classList.add('removed');
		if (selectProfile.isActive && (index === selectProfile.indexProjectile)) {
			let elmManagement = document.getElementById('management');
			selectProfile.isActive = false;
			selectProfile.targetGuides.classList.add('hidden');
			elmManagement.classList.add('compact');
			toggleIdleness(true);
		}
	},
	restart: function() {
		let elmRdoExplosion = document.getElementById('rdoExplosion');
		galaxy.restart();
		this.total = 0;
		this.targetGalaxy.innerHTML = '';
		radioZero(elmRdoExplosion, false);
	},
	load: function(dataIn) {
		return new Promise(function(resolve) {
			let dataDecoded;
			try {
				dataDecoded = JSON.parse(dataIn);
			} catch(error) {
				resolve('errDecoding');
			}
			if (galaxy.load(dataDecoded)) {
				let elmBtnFit = document.getElementById('btnFit');
				let elmRdoExplosion = document.getElementById('rdoExplosion');
				galaxy.shift(0.5*mainProfile.targetGalaxy.offsetWidth, 0.5*mainProfile.targetGalaxy.offsetHeight);
				mainProfile.targetGalaxy.innerHTML = '';
				for (let i = 0; i < galaxy.projectileS.length; i++) {
					mainProfile.add();
					if (galaxy.projectileS[i] === null || galaxy.projectileS[i].isRemoved) {
						mainProfile.targetProjectileS[i].classList.add('removed');
					} else {
						downloadData(i);
					}
				}
				if (galaxy.originIndex !== null) {
					mainProfile.targetProjectileS[galaxy.originIndex].classList.add('origin');
				}
				elmBtnFit.click();
				radioZero(elmRdoExplosion, galaxy.hasExplosion);
				resolve(null);
			} else {
				resolve('errContent');
			}
		});
	},
	save: function() {
		let elmA = document.createElement('a');
		elmA.href = URL.createObjectURL(new Blob(
			[galaxy.save()],
			{type: 'application/json'}));
		elmA.download = 'galaxy.json';
		elmA.click();
	},
	roll: function(state) {
		let elmInpInputName = document.getElementById('inpName').parentElement;
		let elmInpPickerMaterial = document.getElementById('pckMaterial').parentElement;
		let elmInpSliderMass = document.getElementById('sldMass').parentElement;
		let elmInpSliderTemperature = document.getElementById('sldTemperature').parentElement;
		let elmInpSliderSpeed = document.getElementById('sldSpeed').parentElement;
		let elmInpSliderDirection = document.getElementById('sldDirection').parentElement;
		let elmBtnRevert = document.getElementById('btnRevert');
		let elmBtnRoll = document.getElementById('btnRoll');
		if (state) {
			elmInpInputName.classList.add('disabled');
			elmInpPickerMaterial.classList.add('disabled');
			elmInpSliderMass.classList.add('disabled');
			elmInpSliderTemperature.classList.add('disabled');
			elmInpSliderSpeed.classList.add('disabled');
			elmInpSliderDirection.classList.add('disabled');
			elmBtnRevert.classList.add('hidden');
			elmBtnRoll.classList.add('flip');
			if (selectProfile.isActive) {
				uploadCurrentData();
			}
			message(null);
			this.promise = galaxy.roll(true);
		} else {
			galaxy.roll(false);
			toggleIdleness(true);
			elmBtnRoll.classList.add('active');
			this.promise.then(function() {
				elmInpInputName.classList.remove('disabled');
				elmInpPickerMaterial.classList.remove('disabled');
				elmInpSliderMass.classList.remove('disabled');
				elmInpSliderTemperature.classList.remove('disabled');
				elmInpSliderSpeed.classList.remove('disabled');
				elmInpSliderDirection.classList.remove('disabled');
				elmBtnRevert.classList.remove('hidden');
				elmBtnRevert.classList.add('disabled');
				elmBtnRoll.classList.remove('flip');
				elmBtnRoll.classList.remove('active');
			});
		}
	},
	getBoundingBox: function() {
		if (this.total === 0) {
			return [0.5*this.targetGalaxy.offsetHeight, 0.5*this.targetGalaxy.offsetWidth, window.innerWidth, window.innerHeight];
		}
		let minTop = Infinity;
		let maxTop = -Infinity;
		let minLeft = Infinity;
		let maxLeft = -Infinity;
		let width;
		let height;
		for (let i = 0; i < this.targetProjectileS.length; i++) {
			if (this.targetProjectileS[i].classList.contains('removed')) {
				continue;
			}
			if (minTop > this.targetProjectileS[i].offsetTop) {
				minTop = this.targetProjectileS[i].offsetTop;
			}
			if (maxTop < this.targetProjectileS[i].offsetTop + this.targetProjectileS[i].offsetHeight) {
				maxTop = this.targetProjectileS[i].offsetTop + this.targetProjectileS[i].offsetHeight;
			}
			if (minLeft > this.targetProjectileS[i].offsetLeft) {
				minLeft = this.targetProjectileS[i].offsetLeft;
			}
			if (maxLeft < this.targetProjectileS[i].offsetLeft + this.targetProjectileS[i].offsetWidth) {
				maxLeft = this.targetProjectileS[i].offsetLeft + this.targetProjectileS[i].offsetWidth;
			}
		}
		width = maxLeft - minLeft;
		height = maxTop - minTop;
		return [minTop + 0.5*height, minLeft + 0.5*width, width, height];
	}
}
let selectProfile = {
	isActive: false,
	hasGuides: true,
	indexProjectile: null,
	targetGuides: null,
	activate: function(index=mainProfile.targetProjectileS.length - 1) {
		if (this.isActive && (this.indexProjectile === index)) {
			return;
		}
		let elmManagement = document.getElementById('management');
		let elmRdoOrigin = document.getElementById('rdoOrigin');
		let elmBtnRevert = document.getElementById('btnRevert');
		if (this.isActive) {
			mainProfile.targetProjectileS[this.indexProjectile].classList.remove('selected');
			uploadCurrentData();
			toggleAbruptness('slider');
		} else {
			this.isActive = true;
		}
		this.indexProjectile = index;
		if (galaxy.isPaused) {
			downloadData();
		}
		elmManagement.classList.remove('compact');
		radioZero(elmRdoOrigin, mainProfile.targetProjectileS[index].classList.contains('origin'), false);
		elmBtnRevert.classList.add('disabled');
		mainProfile.targetProjectileS[this.indexProjectile].classList.add('selected');
		this.targetGuides.classList.remove('hidden');
	},
	deactivate: function() {
		if (!this.isActive) {
			return;
		}
		let elmManagement = document.getElementById('management');
		uploadCurrentData();
		elmManagement.classList.add('compact');
		mainProfile.targetProjectileS[this.indexProjectile].classList.remove('selected');
		this.targetGuides.classList.add('hidden');
		this.isActive = false;
	}
}
let dragProfile = {
	isActive: false,
	type: null,
	targetElement: null,
	inTop: null,
	inLeft: null,
	outTop: null,
	outLeft: null,
	gain: null,
	activate: function(type, targetElement, inTop, inLeft, outTop, outLeft, gain) {
		this.isActive = true;
		this.type = type;
		this.targetElement = targetElement;
		this.inTop = inTop;
		this.inLeft = inLeft;
		this.outTop = outTop;
		this.outLeft = outLeft;
		this.gain = gain;
		if ((type === 'slider') && targetElement.id === 'sldScale') {
			scaleProfile.activate();
		}
	},
	deactivate: function() {
		this.isActive = false;
	}
};
let scaleProfile = {
	isActive: false,
	scale: null,
	offsetScaledTop: null,
	offsetScaledLeft: null,
	scaleOld: null,
	offsetScaledTopOld: null,
	offsetScaledLeftOld: null,
	centerTopOld: null,
	centerLeftOld: null,
	capture: function() {
		let rectGalaxy = mainProfile.targetGalaxy.getBoundingClientRect();
		scaleProfile.scaleOld = scaleProfile.scale;
		scaleProfile.offsetScaledTopOld = rectGalaxy.top;
		scaleProfile.offsetScaledLeftOld = rectGalaxy.left;
		scaleProfile.centerTopOld = rectGalaxy.top + 0.5*rectGalaxy.height;
		scaleProfile.centerLeftOld = rectGalaxy.left + 0.5*rectGalaxy.width;
	},
	activate: function() {
		scaleProfile.isActive = true;
		this.capture();
	},
	deactivate: function() {
		this.isActive = false;
	}
}

window.addEventListener('load', function() {
	//inputs
	let elmInpInputS = document.getElementsByTagName('input');
	for (let i = 0; i < elmInpInputS.length; i++) {
		elmInpInputS[i].addEventListener('input', function() {
			renameZero(this);
		});
	}

	//pickers
	let elmPckS = document.getElementsByClassName('picker');
	for (let i = 0; i < elmPckS.length; i++) {
		elmPckS[i].sampleItem = elmPckS[i].getElementsByClassName('item')[0];
		elmPckS[i].sampleItem.remove();
		for (let j = 0; j < initials.palette.length; j++) {
			let elmItem = elmPckS[i].sampleItem.cloneNode(true);
			elmItem.style.backgroundColor = initials.palette[j];
			elmItem.addEventListener('click', function() {
				toggleAbruptness('projectile');
				pickZero(elmPckS[i], j);
			});
			elmPckS[i].append(elmItem);
		}
	}

	//sliders
	let elmSldS = document.getElementsByClassName('slider');
	for (let i = 0; i < elmSldS.length; i++) {
		let elmTitle = elmSldS[i].parentElement.getElementsByClassName('title')[0];
		let limits = [initials[elmSldS[i].id+'Limits'][0], initials[elmSldS[i].id+'Limits'][3]];
		let map;
		let mapInverse;
		let progressDefault = null;
		let unit = '';
		let mask;
		switch (elmSldS[i].dataset['mapping']) {
			case 'curve':
				map = function(progress) {
					return limits[0]*Math.pow(limits[1]/limits[0], progress);
				}
				mapInverse = function(value) {
					return Math.log(value/limits[0])/Math.log(limits[1]/limits[0]);
				}
				break;
			default:
				map = function(progress) {
					return (1 - progress)*limits[0] + progress*limits[1];
				}
				mapInverse = function(value) {
					return (value - limits[0])/(limits[1] - limits[0]);
				}
				break;
		}
		if (elmSldS[i].dataset['default'] !== undefined) {
			progressDefault = mapInverse(parseFloat(elmSldS[i].dataset['default']));
		}
		if (elmSldS[i].dataset['unit'] !== undefined) {
			unit = elmSldS[i].dataset['unit'];
		}
		if (elmSldS[i].dataset['mask'] !== undefined) {
			let temp = elmSldS[i].dataset['mask'].toString().split(',');
			if (temp.some(value => isNaN(parseFloat(value)))) {
				let constraints = [temp[0],temp[temp.length-1]];
				if (elmSldS[i].dataset['constraints'] !== undefined) {
					constraints = elmSldS[i].dataset['constraints'].toString().split(',');
				}
				mask = function(progress) {
					if (progress === 0) {
						return constraints[0];
					}
					if (progress === 1) {
						return constraints[1];
					}
					return temp[(progress*(temp.length - 1)).toFixed()]+unit;
				}
			} else {
				mask = function(progress) {
					return ((1-progress)*temp[0] + progress*temp[1]).toFixed(2)+unit;
				}
			}
		} else {
			mask = function(progress) {
				return map(progress).toFixed(2)+unit;
			}
		}
		elmSldS[i].progressDefault = progressDefault;
		elmSldS[i].progress = progressDefault;
		elmSldS[i].map = map;
		elmSldS[i].mapInverse = mapInverse;
		elmSldS[i].mask = mask;
		elmSldS[i].addEventListener('mousedown', function(event) {
			let elmLine = this.getElementsByClassName('line')[0];
			let elmHandle = this.getElementsByClassName('handle')[0];
			let rectLine = elmLine.getBoundingClientRect();
			if (elmHandle.contains(event.target)) {
				dragProfile.activate('slider', this, null, elmSldS[i].progress, null, event.clientX, rectLine.width);
			} else {
				let eventMove = new Event('mousemove');
				eventMove.clientX = event.clientX;
				eventMove.clientY = event.clientY;
				dragProfile.activate('slider', this, null, (event.clientX - rectLine.left)/rectLine.width, null, event.clientX, rectLine.width);
				window.dispatchEvent(eventMove);
			}
		});
		elmTitle.addEventListener('click', function() {
			if (elmSldS[i].progressDefault === null) {
				return;
			}
			toggleAbruptness();
			slideZero(elmSldS[i], elmSldS[i].progressDefault);
		});
	}

	//radio
	let elmRdsS = document.getElementsByClassName('radio');
	for (let i = 0; i < elmRdsS.length; i++) {
		elmRdsS[i].value = !elmRdsS[i].classList.contains('empty');
		elmRdsS[i].addEventListener('click', function() {
			radioZero(elmRdsS[i]);
		});
	}

	//buttons
	let elmBtnS = document.getElementsByClassName('button');
	for (let i = 0; i < elmBtnS.length; i++) {
		elmBtnS[i].addEventListener('click', function() {
			if (this.classList.contains('active') || this.classList.contains('disabled')) {
				return;
			}
			buttonClick(this);
		});
	}

	//galaxy
	let elmSldScale = document.getElementById('sldScale');
	scaleProfile.scale = elmSldScale.map(elmSldScale.progressDefault);
	mainProfile.targetGalaxy = document.getElementById('galaxy');
	mainProfile.targetGalaxy.style.width = (100/initials.sldScaleLimits[0])+'%';
	mainProfile.targetGalaxy.style.height = (100/initials.sldScaleLimits[0])+'%';
	mainProfile.targetGalaxy.style.top = (0.5*(window.innerHeight - scaleProfile.scale*mainProfile.targetGalaxy.offsetHeight))+'px';
	mainProfile.targetGalaxy.style.left = (0.5*(window.innerWidth - scaleProfile.scale*mainProfile.targetGalaxy.offsetWidth))+'px';
	mainProfile.targetGalaxy.lineWidthInitial = parseFloat(getComputedStyle(mainProfile.targetGalaxy).getPropertyValue('--lineWidth'));
	mainProfile.targetGalaxy.sampleProjectile = mainProfile.targetGalaxy.getElementsByClassName('projectile')[0];
	mainProfile.targetGalaxy.sampleSvg = mainProfile.targetGalaxy.getElementsByTagName('svg')[0];
	mainProfile.targetGalaxy.sampleProjectile.remove();
	mainProfile.targetGalaxy.sampleSvg.remove();
	mainProfile.targetGalaxy.addEventListener('mousedown', function(event) {
		if (this.classList.contains('creationMode')) {
			this.classList.remove('creationMode');
			if (event.button === 0) {
				let rectGalaxy = this.getBoundingClientRect();
				let rectProjectile;
				galaxy.add({
					positionX: (event.clientX - rectGalaxy.left)/scaleProfile.scale,
					positionY: (event.clientY - rectGalaxy.top)/scaleProfile.scale
				});
				mainProfile.add();
				selectProfile.activate();
				rectProjectile = mainProfile.targetProjectileS[selectProfile.indexProjectile].getBoundingClientRect();
				dragProfile.activate('projectile', null, (event.clientY - 0.5*rectProjectile.height- rectGalaxy.top)/scaleProfile.scale, (event.clientX - 0.5*rectProjectile.width - rectGalaxy.left)/scaleProfile.scale, event.clientY, event.clientX, scaleProfile.scale);
			}
		} else {
			if (event.button === 0) {
				let rectGalaxy = this.getBoundingClientRect();
				dragProfile.activate('galaxy', null, rectGalaxy.top, rectGalaxy.left, event.clientY, event.clientX, null);
			}
			selectProfile.deactivate();
		}
		toggleIdleness(true);
	});
	mainProfile.targetGalaxy.addEventListener('contextmenu', function(event) {
	   event.preventDefault();
	}, true);
	mainProfile.targetProjectileS = document.getElementsByClassName('projectile');
	mainProfile.targetTrajectoryS = document.getElementsByClassName('trajectory');

	//screen
	selectProfile.targetGuides = document.getElementsByClassName('guides')[0];
	let elmVector = selectProfile.targetGuides.getElementsByClassName('vector')[0];
	let elmSpanS = elmVector.getElementsByTagName('span');
	for (let i = 0; i < elmSpanS.length; i++) {
		elmSpanS[i].addEventListener('click', function(event) {
		})
	}

	//Initialization
	for (let i = 0; i < elmSldS.length; i++) {
		let elmTitle = elmSldS[i].parentElement.getElementsByClassName('title')[0];
		elmTitle.click();
	}
	mainProfile.load('{"hasExplosion":false,"originIndex":null,"projectileS":[{"isRemoved":false,' +
		'"isExplosive":true,"name":"mass_KjpJG","material":3,"mass":85.69808484391689,"temperature":1173.8286446952097,' +
		'"velocityX":23.85730214026361,"velocityY":-17.618975556610973,"positionX":7602.933029954183,' +
		'"positionY":3561.1386816643308},{"isRemoved":false,"isExplosive":true,"name":"mass_zSIQQ","material":5,' +
		'"mass":100.18635890766684,"temperature":521.7804362256535,"velocityX":-78.99544499738607,' +
		'"velocityY":-6.642331440693883,"positionX":8038.93743715074,"positionY":3608.1430888608875},{"isRemoved":false,' +
		'"isExplosive":true,"name":"mass_jKkIB","material":2,"mass":49.373020352343566,"temperature":589.8824743367979,' +
		'"velocityX":20.067219239587065,"velocityY":-0.00002568652476450087,"positionX":7753.933523292057,' +
		'"positionY":3789.130853875903},{"isRemoved":true,"isExplosive":true,"name":"mass_fJP8s","material":6,' +
		'"mass":396.23015523198,"temperature":306.5986177584977,"velocityX":-18.402753602760654,' +
		'"velocityY":-34.96737644529308,"positionX":7305.262676269689,"positionY":3701.6349946465025},' +
		'{"isRemoved":false,"isExplosive":true,"name":"mass_EiGHc","material":5,"mass":44.9486832832781,' +
		'"temperature":340.6757906679029,"velocityX":30.75829937790294,"velocityY":-55.76220695227156,' +
		'"positionX":7867.266666666666,"positionY":3895.0119047619055},{"isRemoved":false,"isExplosive":true,' +
		'"name":"mass_Hw2Ek","material":4,"mass":79.50255370472318,"temperature":570.0029439415257,' +
		'"velocityX":20.08451866680716,"velocityY":-10.368979110617833,"positionX":7367.666666666668,' +
		'"positionY":3890.5119047619055},{"isRemoved":false,"isExplosive":true,"name":"mass_xZkpT","material":7,' +
		'"mass":83.14791457273486,"temperature":326.38112245440703,"velocityX":0.4492170317728788' +
		',"velocityY":-0.8934226650164884,"positionX":7285.997811865544,"positionY":3522.4311309573404}]}').then(function() {
			toggleIdleness(true);
	});
});
window.addEventListener('resize', function() {
	concentrate();
	if (selectProfile.isActive) {
		move();
		circle();
		direct();
	}
});
window.addEventListener('mousemove', function(event) {
	if (!dragProfile.isActive) {
		return;
	}
	switch (dragProfile.type) {
		case 'galaxy':
			locate( dragProfile.inTop + (event.clientY - dragProfile.outTop), dragProfile.inLeft + (event.clientX - dragProfile.outLeft));
			break;
		case 'projectile':
			moveZero( dragProfile.inTop + (event.clientY - dragProfile.outTop)/dragProfile.gain, dragProfile.inLeft + (event.clientX - dragProfile.outLeft)/dragProfile.gain);
			break;
		case 'slider':
			slideZero(dragProfile.targetElement, dragProfile.inLeft + (event.clientX - dragProfile.outLeft)/dragProfile.gain);
	}
});
window.addEventListener('mouseup', function() {
	if (dragProfile.isActive) {
		dragProfile.deactivate();
		scaleProfile.deactivate();
	}
});

function buttonClick(elmBtn) {
	let elmControl = document.getElementById('control');
	let elmBtnAllow0 = document.getElementById('btnAllow0');
	let elmBtnLoad = document.getElementById('btnLoad');
	let elmBtnSave = document.getElementById('btnSave');
	let elmBtnRestart = document.getElementById('btnRestart');
	let elmInpSliderRate = document.getElementById('sldRate').parentElement;
	let elmInpSliderScale = document.getElementById('sldScale').parentElement;
	let elmInpRadioNames = document.getElementById('rdoGuides').parentElement;
	let elmInpRadioTrajectory = document.getElementById('rdoTrajectory').parentElement;
	let elmInpRadioExplosion = document.getElementById('rdoExplosion').parentElement;
	switch (elmBtn.id) {
		case 'btnDeny0':
			toggleIdleness(true);
			break;
		case 'btnAllow0':
			let elmBody = document.body;
			let elmInput = document.createElement('input');
			if (!galaxy.isPaused) {
				mainProfile.roll(false);
			}
			selectProfile.deactivate();
			elmBody.onfocus = function() {
				elmBody.onfocus = null;
				setTimeout(function() {
					if (elmInput.files.length > 0) {
						if (elmInput.files[0].type === 'application/json') {
							let reader = new FileReader();
							reader.readAsText(elmInput.files[0]);
							reader.addEventListener('load', function() {
								mainProfile.load(this.result).then(function(id) {
									elmBtnAllow0.classList.remove('active');
									toggleIdleness(true);
									error(id);
								});
							});
						} else {
							elmBtnAllow0.classList.remove('active');
							toggleIdleness(true);
							error('errType');
						}
					} else {
						elmBtnAllow0.classList.remove('active');
						toggleIdleness(true);
					}
				}, 500);
			}
			elmBtn.classList.add('active');
			elmInput.type = 'file';
			elmInput.accept = '.json';
			elmInput.click();
			message('msgWait');
			break;
		case 'btnDeny1':
			toggleIdleness(true);
			break;
		case 'btnAllow1':
			if (!galaxy.isPaused) {
				mainProfile.roll(false);
			}
			selectProfile.deactivate();
			mainProfile.restart();
			toggleIdleness(true);
			break;
		case 'btnRemove':
			mainProfile.remove(selectProfile.indexProjectile);
			toggleIdleness(true);
			break;
		case 'btnRevert':
			toggleAbruptness();
			revertCurrentData();
			elmBtn.classList.add('disabled');
			break;
		case 'btnClose':
			selectProfile.deactivate();
			break;
		case 'btnFit':
			let sldScale = document.getElementById('sldScale');
			let centerTop;
			let centerLeft;
			let width;
			let height;
			[centerTop, centerLeft, width, height] = mainProfile.getBoundingBox();
			toggleAbruptness('galaxy');
			slideZero(sldScale, sldScale.mapInverse(Math.min(window.innerWidth/width, window.innerHeight/height)));
			locate(0.5*window.innerHeight - scaleProfile.scale*centerTop, 0.5*window.innerWidth - scaleProfile.scale*centerLeft);
			if (selectProfile.isActive) {
				move();
				circle();
				direct();
			}
			break;
		case 'btnResize':
			elmBtn.classList.toggle('flip');
			elmControl.classList.toggle('compact');
			elmBtnLoad.classList.toggle('hidden');
			elmBtnSave.classList.toggle('hidden');
			elmBtnRestart.classList.toggle('hidden');
			elmInpSliderRate.classList.toggle('hidden');
			elmInpSliderScale.classList.toggle('hidden');
			elmInpRadioNames.classList.toggle('hidden');
			elmInpRadioTrajectory.classList.toggle('hidden');
			elmInpRadioExplosion.classList.toggle('hidden');
			break;
		case 'btnLoad':
			toggleIdleness(false, elmBtn);
			if (mainProfile.total > 0) {
				message('msgLoad');
			} else {
				elmBtnAllow0.click();
			}
			break;
		case 'btnSave':
			selectProfile.deactivate();
			mainProfile.save();
			break;
		case 'btnAdd':
			if (!galaxy.isPaused) {
				mainProfile.roll(false);
			}
			mainProfile.targetGalaxy.classList.add('creationMode');
			toggleIdleness(false, elmBtn);
			message('msgCreation');
			break;
		case 'btnRestart':
			toggleIdleness(false, elmBtn);
			message('msgRestart');
			break;
		case 'btnRoll':
			mainProfile.roll(!elmBtn.classList.contains('flip'));
	}
}

function error(id) {
	let elmErrS = document.getElementsByClassName('error');
	for (let i = 0; i < elmErrS.length; i++) {
		elmErrS[i].classList.add('compact');
	}
	setTimeout(function() {
		for (let i = 0; i < elmErrS.length; i++) {
			elmErrS[i].classList.add('compact');
		}
	}, 3000);
	if (id !== null) {
		let elmErr = document.getElementById(id);
		elmErr.classList.remove('compact');
	}
}

function message(id, state) {
	let elmMsgS = document.getElementsByClassName('message');
	if (state === undefined) {
		for (let i = 0; i < elmMsgS.length; i++) {
			elmMsgS[i].classList.add('compact');
		}
		state = true;
	}
	if (id !== null) {
		let elmMsg = document.getElementById(id);
		elmMsg.classList.toggle('compact', !state);
	}
}

function toggleIdleness(state, elmBtn) {
	let elmBtnLoad = document.getElementById('btnLoad');
	let elmBtnSave = document.getElementById('btnSave');
	let elmBtnAdd = document.getElementById('btnAdd');
	let elmBtnRestart = document.getElementById('btnRestart');
	let elmBtnRoll = document.getElementById('btnRoll');
	if (state) {
		mainProfile.targetGalaxy.classList.remove('creationMode');
		elmBtnLoad.classList.remove('active');
		elmBtnAdd.classList.remove('active');
		elmBtnRestart.classList.remove('active');
		elmBtnLoad.classList.remove('disabled');
		elmBtnAdd.classList.remove('disabled');
		if (mainProfile.total > 0) {
			elmBtnSave.classList.remove('disabled');
			elmBtnRestart.classList.remove('disabled');
			elmBtnRoll.classList.remove('disabled');
			message(null);
		} else {
			elmBtnSave.classList.add('disabled');
			elmBtnRestart.classList.add('disabled');
			if (galaxy.isPaused) {
				elmBtnRoll.classList.add('disabled');
			}
			message('msgStart');
		}
	} else {
		elmBtnLoad.classList.add('disabled');
		elmBtnSave.classList.add('disabled');
		elmBtnAdd.classList.add('disabled');
		elmBtnRestart.classList.add('disabled');
		elmBtnRoll.classList.add('disabled');
		if (elmBtn !== undefined) {
			elmBtn.classList.remove('disabled');
			elmBtn.classList.add('active');
		}
	}
}

function toggleAbruptness(type) {
	if (!galaxy.isPaused) {
		return;
	}
	const core = function(state, type) {
		if ((type === 'galaxy') || (type === undefined)) {
			mainProfile.targetGalaxy.classList.toggle('abrupt', state);
		}
		if ((type === 'projectile') || (type === undefined)) {
			if (selectProfile.isActive) {
				mainProfile.targetProjectileS[selectProfile.indexProjectile].classList.toggle('abrupt', state);
			}
		}
		if ((type === 'guides') || (type === undefined)) {
			selectProfile.targetGuides.classList.toggle('abrupt', state);
		}
		if ((type === 'slider') || (type === undefined)) {
			let elmSldS = document.getElementsByClassName('slider');
			for (let i = 0; i < elmSldS.length; i++) {
				elmSldS[i].classList.toggle('abrupt', state);
			}
		}
		if (!state) {
			let elmBody = document.body;
			return parseInt(getComputedStyle(elmBody).getPropertyValue('--durationShort'));
		}
	};
	let delay = core(false, type);
	setTimeout(function() {
		core(true, type);
	}, delay);
}

function moveZero(offsetTop, offsetLeft) {
	processCurrentData('positionTop', offsetTop + mainProfile.currentData.sldRadius);
	processCurrentData('positionLeft', offsetLeft + mainProfile.currentData.sldRadius);
	move();
}
function move(index=selectProfile.indexProjectile, positionTop=mainProfile.currentData.positionTop, positionLeft=mainProfile.currentData.positionLeft, radius=mainProfile.currentData.sldRadius) {
	mainProfile.targetProjectileS[index].style.top = (positionTop - radius)+'px';
	mainProfile.targetProjectileS[index].style.left = (positionLeft - radius)+'px';
	if (selectProfile.isActive && selectProfile.hasGuides && (selectProfile.indexProjectile === index)) {
		let radiusScaled = scaleProfile.scale*radius;
		selectProfile.targetGuides.style.top = (scaleProfile.scale*(positionTop) - radiusScaled + scaleProfile.offsetScaledTop)+'px';
		selectProfile.targetGuides.style.left = (scaleProfile.scale*(positionLeft) - radiusScaled + scaleProfile.offsetScaledLeft)+'px';
	}
}

function traject(index=selectProfile.indexProjectile, trajectory=mainProfile.currentData.trajectory) {
	mainProfile.targetTrajectoryS[index].setAttribute('d', trajectory);
}

function renameZero(elmInp) {
	processCurrentData('inpName', elmInp.value);
	checkName(elmInp);
}
function rename(elmInp) {
	elmInp.value = mainProfile.currentData.inpName;
	checkName(elmInp);
}
function checkName(elmInp) {
	let elmNotice = elmInp.parentElement.getElementsByClassName('notice')[0];
	let elmName = selectProfile.targetGuides.getElementsByClassName('name')[0];
	if (elmInp.value === '') {
		elmNotice.classList.remove('hidden');
		elmName.classList.add('hidden');
	} else {
		elmNotice.classList.add('hidden');
		elmName.classList.remove('hidden');
	}
	elmName.innerText = elmInp.value;
}

function pickZero(elmPck, row) {
	processCurrentData(elmPck.id, row);
	pick(elmPck, row);
}
function pick(elmPck, row=mainProfile.currentData[elmPck.id]) {
	let elmItemS = elmPck.getElementsByClassName('item');
	for (let i = 0; i < elmItemS.length; i++) {
		elmItemS[i].classList.remove('selected');
	}
	elmItemS[row].classList.add('selected');
	switch (elmPck.id) {
		case 'pckMaterial':
			colorize();
	}
}
function colorize(index=selectProfile.indexProjectile, row=mainProfile.currentData.pckMaterial, mass=mainProfile.currentData.sldMass, temperature=mainProfile.currentData.sldTemperature) {
	let elmSldTemperature = document.getElementById('sldTemperature');
	let progressSldTemperature = elmSldTemperature.mapInverse(temperature);
	if (mass === initials.sldMassLimits[0]) {
		mainProfile.targetProjectileS[index].style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
	} else if (mass === initials.sldMassLimits[3]) {
		mainProfile.targetProjectileS[index].style.backgroundColor = 'rgba(0, 0, 0)';
	} else {
		let colorArray = initials.palette[row].match(/\w\w/g).map(code => parseInt(code.toString(), 16));
		let colorString = 'rgb(';
		for (let i = 0; i < colorArray.length; i++) {
			colorString += ((1 - initials.temperatureFactor)*colorArray[i] + initials.temperatureFactor*progressSldTemperature*255).toFixed()+',';
		}
		colorString = colorString.slice(0,-1)+')';
		mainProfile.targetProjectileS[index].style.backgroundColor = colorString;
	}
	mainProfile.targetTrajectoryS[index].parentElement.style.stroke = initials.palette[row];
}

function slideZero(elmSld, progress) {
	if (progress < 0) {
		progress = 0;
	}
	if (progress > 1) {
		progress = 1;
	}
	if ((elmSld.id !== 'sldRate') && (elmSld.id !== 'sldScale')) {
		processCurrentData(elmSld.id, elmSld.map(progress));
	}
	slide(elmSld, progress);
}
function slide(elmSld, progress=elmSld.mapInverse(mainProfile.currentData[elmSld.id])) {
	let elmNotice = elmSld.parentElement.getElementsByClassName('notice')[0];
	let elmHandle = elmSld.getElementsByClassName('handle')[0];
	let elmVector = selectProfile.targetGuides.getElementsByClassName('vector')[0];
	let value;
	elmSld.progress = progress;
	elmNotice.innerText = elmSld.mask(progress);
	elmHandle.style.left = (100*progress)+'%';
	switch (elmSld.id) {
		case 'sldMass':
			move();
			circle();
			colorize();
			if (selectProfile.isActive && selectProfile.hasGuides) {
				direct();
			}
			break;
		case 'sldTemperature':
			colorize();
			break;
		case 'sldSpeed':
			if (selectProfile.isActive && selectProfile.hasGuides) {
				direct();
			}
			break;
		case 'sldDirection':
			if (selectProfile.isActive && selectProfile.hasGuides) {
				elmVector.style.transform = 'rotate('+(-mainProfile.currentData.sldDirection)+'rad)';
			}
			break;
		case 'sldRate':
			value = elmSld.map(progress);
			galaxy.setRate(value);
			break;
		case 'sldScale':
			value = elmSld.map(progress);
			concentrate(value);
			if (selectProfile.isActive) {
				move();
				circle();
				direct();
			}
			break;
	}
}
function circle(index=selectProfile.indexProjectile, radius=mainProfile.currentData.sldRadius) {
	mainProfile.targetProjectileS[index].style.width = (2*radius)+'px';
	mainProfile.targetProjectileS[index].style.height = (2*radius)+'px';
	if (selectProfile.isActive && selectProfile.hasGuides && (index === selectProfile.indexProjectile)) {
		let radiusScaled = scaleProfile.scale*radius;
		selectProfile.targetGuides.style.width = (2*radiusScaled)+'px';
		selectProfile.targetGuides.style.height = (2*radiusScaled)+'px';
	}
}
function direct() {
	let elmSldSpeed = document.getElementById('sldSpeed');
	let elmVector = selectProfile.targetGuides.getElementsByClassName('vector')[0];
	let elmShaft = elmVector.getElementsByClassName('shaft')[0];
	let elmCaretUp = elmVector.getElementsByClassName('caretUp')[0];
	let elmCaretDown = elmVector.getElementsByClassName('caretDown')[0];
	let radiusScaled = scaleProfile.scale*mainProfile.currentData.sldRadius;
	let magnitude = 2*elmSldSpeed.mapInverse(mainProfile.currentData.sldSpeed)*initials.sldRadiusLimits[3];
	elmVector.classList.toggle('hidden', mainProfile.currentData.sldSpeed === initials.sldSpeedLimits[0]);
	elmShaft.style.width = (radiusScaled + magnitude)+'px';
	elmCaretUp.style.left = (2*radiusScaled + magnitude)+'px';
	elmCaretDown.style.left = (2*radiusScaled + magnitude)+'px';
}
function concentrate(scale=scaleProfile.scale) {
	let limit;
	let aimTop;
	let aimLeft;
	let ratio;
	let offsetScaledTopNew;
	let offsetScaledLeftNew;
	if (!scaleProfile.isActive) {
		scaleProfile.capture();
	}
	if (scale < scaleProfile.scaleOld) {
		limit = initials.sldScaleLimits[0];
	} else {
		limit = initials.sldScaleLimits[3];
	}
	if (selectProfile.isActive) {
		aimTop = mainProfile.targetProjectileS[selectProfile.indexProjectile].offsetTop + 0.5*mainProfile.targetProjectileS[selectProfile.indexProjectile].offsetHeight;
		aimLeft = mainProfile.targetProjectileS[selectProfile.indexProjectile].offsetLeft + 0.5*mainProfile.targetProjectileS[selectProfile.indexProjectile].offsetWidth;
	} else {
		[aimTop, aimLeft] = mainProfile.getBoundingBox();
	}
	offsetScaledTopNew = 0.5*window.innerHeight - limit*aimTop;
	offsetScaledLeftNew = 0.5*window.innerWidth - limit*aimLeft;
	if (limit === scaleProfile.scaleOld) {
		ratio = 0;
	} else {
		ratio = (scale - scaleProfile.scaleOld)/(limit - scaleProfile.scaleOld);
	}
	scaleProfile.scale = scale;
	mainProfile.targetGalaxy.style.setProperty('--lineWidth', (mainProfile.targetGalaxy.lineWidthInitial/scale)+'px');
	mainProfile.targetGalaxy.style.transform = 'scale('+scale+')';
	locate((1 - ratio)*scaleProfile.offsetScaledTopOld + ratio*offsetScaledTopNew, (1 - ratio)*scaleProfile.offsetScaledLeftOld + ratio*offsetScaledLeftNew);
}
function locate(offsetScaledTop, offsetScaledLeft) {
	if (offsetScaledTop < window.innerHeight - scaleProfile.scale*mainProfile.targetGalaxy.offsetHeight) {
		offsetScaledTop = window.innerHeight - scaleProfile.scale*mainProfile.targetGalaxy.offsetHeight;
	}
	if (offsetScaledTop > 0) {
		offsetScaledTop = 0;
	}
	if (offsetScaledLeft < window.innerWidth - scaleProfile.scale*mainProfile.targetGalaxy.offsetWidth) {
		offsetScaledLeft = window.innerWidth - scaleProfile.scale*mainProfile.targetGalaxy.offsetWidth;
	}
	if (offsetScaledLeft > 0) {
		offsetScaledLeft = 0;
	}
	scaleProfile.offsetScaledTop = offsetScaledTop;
	scaleProfile.offsetScaledLeft = offsetScaledLeft;
	mainProfile.targetGalaxy.style.top = (offsetScaledTop + (scaleProfile.offsetScaledTopOld - scaleProfile.centerTopOld)*(1 - scaleProfile.scale)/scaleProfile.scaleOld)+'px';
	mainProfile.targetGalaxy.style.left = (offsetScaledLeft + (scaleProfile.offsetScaledLeftOld - scaleProfile.centerLeftOld)*(1 - scaleProfile.scale)/scaleProfile.scaleOld)+'px';
}

function radioZero(elmRdo, state=!elmRdo.value, apply=true) {
	elmRdo.value = state;
	elmRdo.classList.toggle('empty', !state);
	if (!apply) {
		return;
	}
	switch (elmRdo.id) {
		case 'rdoOrigin':
			for (let i = 0; i < mainProfile.targetProjectileS.length; i++) {
				mainProfile.targetProjectileS[i].classList.remove('origin');
			}
			if (state) {
				galaxy.setOrigin(selectProfile.indexProjectile);
				mainProfile.targetProjectileS[selectProfile.indexProjectile].classList.add('origin');
			} else {
				galaxy.setOrigin(null);
			}
			break;
		case 'rdoGuides':
			selectProfile.hasGuides = state;
			selectProfile.targetGuides.classList.toggle('disabled');
			if (selectProfile.isActive && selectProfile.hasGuides) {
				move();
				circle();
				direct();
			}
			break;
		case 'rdoTrajectory':
			for (let i = 0; i < mainProfile.targetTrajectoryS.length; i++) {
				mainProfile.targetTrajectoryS[i].parentElement.classList.toggle('disabled');
			}
			break;
		case 'rdoExplosion':
			galaxy.toggleExplosion();
			break;
	}
}

function downloadData(index) {
	if (index === undefined) {
		mainProfile.currentData = {
			inpName: galaxy.projectileS[selectProfile.indexProjectile].name,
			pckMaterial: galaxy.projectileS[selectProfile.indexProjectile].material,
			sldMass: galaxy.projectileS[selectProfile.indexProjectile].mass,
			sldRadius: galaxy.projectileS[selectProfile.indexProjectile].radius,
			sldTemperature: galaxy.projectileS[selectProfile.indexProjectile].temperature,
			sldSpeed: Math.sqrt(Math.pow(galaxy.projectileS[selectProfile.indexProjectile].velocityX, 2) + Math.pow(galaxy.projectileS[selectProfile.indexProjectile].velocityY, 2)),
			sldDirection: Math.atan2(-galaxy.projectileS[selectProfile.indexProjectile].velocityY, galaxy.projectileS[selectProfile.indexProjectile].velocityX),
			positionTop: galaxy.projectileS[selectProfile.indexProjectile].positionY,
			positionLeft: galaxy.projectileS[selectProfile.indexProjectile].positionX,
			trajectory: galaxy.projectileS[selectProfile.indexProjectile].trajectory
		};
		Object.keys(mainProfile.currentData).forEach(key => mainProfile.currentBackup[key] = mainProfile.currentData[key]);
		applyData(selectProfile.indexProjectile, mainProfile.currentData);
	} else {
		applyData(index, {
			pckMaterial: galaxy.projectileS[index].material,
			sldMass: galaxy.projectileS[index].mass,
			sldRadius: galaxy.projectileS[index].radius,
			sldTemperature: galaxy.projectileS[index].temperature,
			positionTop: galaxy.projectileS[index].positionY,
			positionLeft: galaxy.projectileS[index].positionX,
			trajectory: galaxy.projectileS[index].trajectory
		}, false);
	}
}
function applyData(index=selectProfile.indexProjectile, data=mainProfile.currentData, isDeep=true) {
	if (isDeep) {
		let elmInpName = document.getElementById('inpName');
		let elmPckMaterial = document.getElementById('pckMaterial');
		let elmSldMass = document.getElementById('sldMass');
		let elmSldTemperature = document.getElementById('sldTemperature');
		let elmSldSpeed= document.getElementById('sldSpeed');
		let elmSldDirection = document.getElementById('sldDirection');
		move();
		traject();
		rename(elmInpName);
		pick(elmPckMaterial);
		slide(elmSldMass);
		slide(elmSldTemperature);
		slide(elmSldSpeed);
		slide(elmSldDirection);
	} else {
		move(index, data.positionTop, data.positionLeft, data.sldRadius);
		traject(index, data.trajectory);
		colorize(index, data.pckMaterial, data.sldMass, data.sldTemperature);
		circle(index, data.sldRadius);
	}
}
function revertCurrentData() {
	Object.keys(mainProfile.currentData).forEach(key => mainProfile.currentData[key] = mainProfile.currentBackup[key]);
	applyData();
}
function processCurrentData(key, value) {
	let elmBtnRevert = document.getElementById('btnRevert');
	let keys = Object.keys(mainProfile.currentData);
	let isChanged = false;
	mainProfile.currentData[key] = value;
	if (key === 'sldMass') {
		mainProfile.currentData.sldRadius = Projectile.massToRadius(value);
	}
	for (let i = 0; i < keys.length; i++) {
		isChanged |= (mainProfile.currentData[keys[i]] !== mainProfile.currentBackup[keys[i]]);
	}
	elmBtnRevert.classList.toggle('disabled', !isChanged);
}
function uploadCurrentData() {
	if (!galaxy.isPaused) {
		return;
	}
	galaxy.projectileS[selectProfile.indexProjectile].name = mainProfile.currentData.inpName;
	galaxy.projectileS[selectProfile.indexProjectile].material = mainProfile.currentData.pckMaterial;
	galaxy.projectileS[selectProfile.indexProjectile].mass = mainProfile.currentData.sldMass;
	galaxy.projectileS[selectProfile.indexProjectile].radius = mainProfile.currentData.sldRadius;
	galaxy.projectileS[selectProfile.indexProjectile].temperature = mainProfile.currentData.sldTemperature;
	galaxy.projectileS[selectProfile.indexProjectile].velocityX = mainProfile.currentData.sldSpeed*Math.cos(mainProfile.currentData.sldDirection);
	galaxy.projectileS[selectProfile.indexProjectile].velocityY = -mainProfile.currentData.sldSpeed*Math.sin(mainProfile.currentData.sldDirection);
	galaxy.projectileS[selectProfile.indexProjectile].positionX = mainProfile.currentData.positionLeft;
	galaxy.projectileS[selectProfile.indexProjectile].positionY = mainProfile.currentData.positionTop;
}