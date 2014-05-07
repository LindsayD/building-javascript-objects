function copy(target, source) {
    for (var prop in source) {
        if (source.hasOwnProperty(prop)) target[prop] = source[prop];
    }
}

function Person(init) {
    this.name = init.name || this.name;
    this.weapon = init.weapon || this.weapon;
    this.house = init.house || this.house;
}

Person.prototype.getHouse = function() { return this.house; };
Person.prototype.brandish = function() { alert(this.name + ' brings forth ' + this.weapon); };
Person.prototype.scheme = function() { alert(this.name + ' plots '); };
Person.prototype.die = function() { this.isDeadYet = true; };

var personDefaults = {
    isDeadYet: false,
    gender: 'female',
    location: "King's Landing",
    house: 'Lannister'
};

_.extend(Person.prototype, personDefaults);

var person1Data = { name: 'Sansa', weapon: 'her disillusionment' };

var person = new Person(person1Data);

function Female(data) {
    var obj = new Person(data);
    obj.constructor = Female;
    copy(this, obj);
}

Female.prototype = person;
Female.prototype.isMother = false;
var female = new Female(person1Data);

function Queen(data) {
    var obj = new Female(data);
    obj.constructor = Queen;
    copy(this, obj);
}

Queen.prototype = female;
Queen.prototype.presidesOver = 'Seven Kingdoms';

var queen = new Queen(person1Data);

