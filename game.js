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
            //doors are just marked as walls at this point
        };
                
        var dugmap = digger.create(digCallback.bind(this));
        
        this._createPlaer(freeCells);
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
            this.display.draw(x, y, this.map[key], "#ff0");
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
    //numpad directions
    keyMap[ROT.VK_UP] = 0;
    keyMap[ROT.VK_PAGE_UP] = 1;
    keyMap[ROT.VK_RIGHT] = 2;
    keyMap[ROT.VK_PAGE_DOWN] = 3;
    keyMap[ROT.VK_DOWN] = 4;
    keyMap[ROT.VK_END] = 5;
    keyMap[ROT.VK_LEFT] = 6;
    keyMap[ROT.VK_HOME] = 7;
    keyMap[ROT.VK_NUMPAD8] = 0;
    keyMap[ROT.VK_NUMPAD9] = 1;
    keyMap[ROT.VK_NUMPAD6] = 2;
    keyMap[ROT.VK_NUMPAD3] = 3;
    keyMap[ROT.VK_NUMPAD2] = 4;
    keyMap[ROT.VK_NUMPAD1] = 5;
    keyMap[ROT.VK_NUMPAD4] = 6;
    keyMap[ROT.VK_NUMPAD7] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if (!(code in keyMap)) { 
        return; 
    }

    /* is there a free space? */
    var dir = ROT.DIRS[8][keyMap[code]];
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var newKey = newX + "," + newY;
    if (!(newKey in Game.map) ||  (Game.map[newKey] === "#")) { 
        return; 
    }

    this._x = newX;
    this._y = newY;
    window.removeEventListener("keydown", this);
    Game.engine.unlock();
};
