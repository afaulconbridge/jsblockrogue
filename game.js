/*global ROT */

var Game = {
    display: null,
    player: null,
    engine: null,
    map: {},
 
    init: function() {
        this.display = new ROT.Display({spacing:1.1});
        document.body.appendChild(this.display.getContainer());
        
        this._generateMap();

        var scheduler = new ROT.Scheduler.Simple();
        scheduler.add(this.player, true);
        this.engine = new ROT.Engine(scheduler);
        this.engine.start();
    },
    
    _generateMap: function() {
        
        var config = {
            corridorLength:[1,3],
            dugPercentage:0.5,
            roomWidth:[3,9],
            roomheight:[3,9],
        };
        
        var digger = new ROT.Map.Digger(ROT.DEFAULT_WIDTH, ROT.DEFAULT_HEIGHT, config);
        var freeCells = [];
     
        var digCallback = function(x, y, value) {
            var key = x+","+y;
            //value is 1 or zero depending if its a wall or not
            if (value) {
                this.map[key] = "#";
            } else {
                this.map[key] = ".";
                freeCells.push(key);
            }
        };
        
        
        var dugmap = digger.create(digCallback.bind(this));
        
        //at this point we have some rooms and some corridors
        //go through everything and put it in the map
        for (var y = 0 ; y  < ROT.DEFAULT_HEIGHT; y++) {
            for (var x = 0 ; x < ROT.DEFAULT_WIDTH; x++) {
                this.map[x+","+y] = '#';
            }
        }
        
        var rooms = dugmap.getRooms();
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            for (var y = room.getTop() ; y  <= room.getBottom(); y++) {
                for (var x = room.getLeft() ; x  <= room.getRight(); x++) {
                    this.map[x+","+y] = '.';
                }
            }    
            //access doors as private variables
            for (var j = 0; j < room._doors.length; j++) {
                var door = room._doors[j];
                console.log("Door "+door);
                this.map[door] = '+';
            }
        }
        var corridors = dugmap.getCorridors(); 
        for (var i = 0; i < corridors.length; i++) {
            var corridor = corridors[i];
            //have to access this as private variables
            var minY = Math.min(corridor._startY, corridor._endY);
            var maxY = Math.max(corridor._startY, corridor._endY);
            var minX = Math.min(corridor._startX, corridor._endX);
            var maxX = Math.max(corridor._startX, corridor._endX);
            for (var y = minY ; y <= maxY; y++) {
                for (var x = minX ; x <= maxX; x++) {
                    this.map[x+","+y] = '.';
                }
            }    
        }
        
        this._createPlayer(freeCells);
    },
    
    _createPlayer: function(freeCells) {
        var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
        var key = freeCells.splice(index, 1)[0];
        var parts = key.split(",");
        var x = parseInt(parts[0]);
        var y = parseInt(parts[1]);
        this.player = new Player(x, y);
    },
    
    _drawWholeMap: function() {
        for (var key in this.map) {
            var parts = key.split(",");
            var x = parseInt(parts[0]);
            var y = parseInt(parts[1]);
            this.display.draw(x, y, this.map[key]);
        }
        this.display.draw(this.player._x, this.player._y, "@", "#ff0");
    }
};

var Player = function(x, y) {
    this._x = x;
    this._y = y;
};

Player.prototype.act = function() {
    Game._drawWholeMap();
    Game.engine.lock();
    window.addEventListener("keydown", this);
};
    
Player.prototype.handleEvent = function(e) {
    
    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if (!(code in keyMap)) { return; }

    /* is there a free space? */
    var dir = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) { return; }

    this._x = newX;
    this._y = newY;
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
};
