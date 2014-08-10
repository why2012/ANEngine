/**
	Auhtor:WHY
	Description:a simple 2d engine binded with box2d
*/
var ANEngine = function()
{

}
ANEngine.Platform = "desktop";//or mobile or both
ANEngine.drawScale = 30;//一单位对应30像素
ANEngine.offsetX = 0;//X平移 camera
ANEngine.offsetY = 0;//y平移 camera
ANEngine.fps = 60;
//物理引擎采用box2d
ANEngine.physicalEngine = {};
ANEngine.physicalEngine.velocityIterations = 8;
ANEngine.physicalEngine.positionIterations = 3;
ANEngine.physicalEngine.gravity = {x:0,y:10};
//粒子系统
ANEngine.Particle = {};
//摄像机
ANEngine.Camera = {};
//复杂组合体
ANEngine.physicalEngine.ComplexShape = {};
//事件
ANEngine.Event = {};
//控件
ANEngine.Widget = {};
//动画插件
ANEngine.Animation = {};

//每帧渲染
ANEngine.render = function(scene)
{
	ANEngine.physicalEngine.step(scene.phyWorld,1/ANEngine.fps,ANEngine.physicalEngine.velocityIterations,
		ANEngine.physicalEngine.positionIterations);
	scene.phyWorld.ClearForces();
	scene.drawScene();
}

ANEngine.Scene = function(_canvas)
{
	var prevTime = 0;
	var curTime = 0;
	var width = _canvas.width;
	var height = _canvas.height;
	this.canvas = _canvas;
	this.whFactor = width/height;
	var canvas = _canvas.getContext("2d");
	var layers = new Array();
	var backgroud = null;
	var camera = null;
	this.phyWorld = ANEngine.physicalEngine.createWorld(ANEngine.physicalEngine.gravity.x,ANEngine.physicalEngine.gravity.y);
	var mouseEventDetector = new ANEngine.Event.MouseEventDetector(_canvas);
	mouseEventDetector.onclick = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.onclick(e,pos))
				break;
		}
	}

	mouseEventDetector.mousedown = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.mousedown(e,pos))
				break;
		}
	}

	mouseEventDetector.mouseup = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.mouseup(e,pos))
				break;
		}
	}

	mouseEventDetector.mouseover = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.mouseover(e,pos))
				break;
		}
	}

	mouseEventDetector.mousemove = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.mousemove(e,pos))
				break;
		}
	}

	mouseEventDetector.mousemoveout = function(e,pos)
	{
		for(var l=layers.length-1;l>=0;l--)
		{
			if(layers[l].mouseEventDetector.mousemoveout(e,pos))
				break;
		}
	}

	//添加图层
	this.addLayer = function(layer)
	{
		layer.setPhyWorld(this.phyWorld);
		layers.push(layer);
		layer.scene = this;
	}

	//设置背景
	this.setBG = function(image)
	{
		backgroud = image;
	}

	//设置相机
	this.setCamera = function(_camera)
	{
		camera = _camera;
	}

	this.getCamera = function()
	{
		return camera;
	}

	//场景绘制
	this.drawScene = function()
	{
		curTime = new Date().getTime()
		width = _canvas.width
		height = _canvas.height;
		this.whFactor = width/height;
		canvas.clearRect(0,0,width,height);
		if(backgroud!=null)
			canvas.drawImage(backgroud,0,0,width,height);
		//应用相机
		if(camera)
		{
			camera.update();
			ANEngine.drawScale = 900/camera.far;
			ANEngine.offsetX = -camera.x;
			ANEngine.offsetY = -camera.y;
		}
		//camera X,Y重映射
		canvas.translate(ANEngine.offsetX*ANEngine.drawScale,ANEngine.offsetY*ANEngine.drawScale);
		for(var index in layers)
		{
			layers[index].drawLayer(canvas);
		}
		canvas.translate(-ANEngine.offsetX*ANEngine.drawScale,-ANEngine.offsetY*ANEngine.drawScale);
		//FPS Text
		canvas.strokeText(Math.floor(1000/(curTime-prevTime)),10,10);
		prevTime = curTime;
	}
}


ANEngine.Layer = function()
{
	/*
		sprite或其他可视元素池;
		animItem
		{
			function draw(canvas);
		}
	*/
	var animItemPool = new Array();
	var phyWorld = null;
	this.scene = null;
	this.mouseEventDetector = new ANEngine.Event.MouseEventDetector();
	var _this = this;
	this.mouseEventDetector.onclick = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			if(_this.mouseEventDetector.objIn(animItemPool[a],pos,"click"))
				return true;
		}

		return false;
	}

	this.mouseEventDetector.mousedown = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			if(_this.mouseEventDetector.objIn(animItemPool[a],pos,"mousedown"))
			{
				animItemPool[a].mouse_down = true;	
				return true;
			}
		}

		return false;
	}

	this.mouseEventDetector.mouseup = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			//mouseup事件与鼠标位置无关
			if(animItemPool[a].mouse_down&&_this.mouseEventDetector.objIn(animItemPool[a],pos,"mouseup"))
			{
				return true;
			}
			animItemPool[a].mouse_down = false;
		}

		return false;
	}

	this.mouseEventDetector.mouseover = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			if(!animItemPool[a].mouse_on_me&&_this.mouseEventDetector.objIn(animItemPool[a],pos,"mouseover"))
			{
				return true;
			}
		}

		return false;
	}

	this.mouseEventDetector.mousemoveout = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			if(animItemPool[a].mouse_on_me&&_this.mouseEventDetector.objIn(animItemPool[a],pos,"mousemoveout",true))
			{
				return true;
			}
		}

		return false;
	}

	this.mouseEventDetector.mousemove = function(e,pos)
	{
		for(var a=animItemPool.length-1;a>=0;a--)
		{
			if(_this.mouseEventDetector.objIn(animItemPool[a],pos,"mousemove"))
				return true;
		}

		return false;
	}

	this.setPhyWorld = function(world)
	{
		phyWorld = world;
	}

	//添加可视元素
	this.addAnimItem = function(animItem)
	{
		animItemPool.push(animItem);
		animItem.layer = this;
		return animItem;
	}

	//移除元素
	this.removeAnimItem = function(animItem)
	{
		var index = animItemPool.indexOf(animItem);
		if(index!=-1)
		{
			animItemPool.splice(index,1);
			return animItem;
		}

		return null;
	}

	this.contains = function(animItem)
	{
		if(animItemPool.indexOf(animItem)!=-1)
			return true;
		else
			return false;
	}

	//添加可视元素的物理外形
	this.addAnimItemPhy = function(animItem)
	{
		var phyAttr = animItem.getPhyAttr();
		if(phyWorld!=null&&phyAttr.body==null)
		{
			phyAttr.body = phyWorld.CreateBody(phyAttr.bodyDef);
			phyAttr.body.CreateFixture(phyAttr.fixture);
		}
	}

	//更新可视元素的物理外形
	this.updateAnimItemPhy = function(animItem)
	{
		if(phyWorld!=null)
		{
			var phyAttr = animItem.getPhyAttr();
			phyWorld.DestroyBody(phyAttr.body);
			phyAttr.body = phyWorld.CreateBody(phyAttr.bodyDef);
			phyAttr.body.CreateFixture(phyAttr.fixture);
		}
	}

	//删除可视元素的物理外形
	this.destroyAnimItemPhy = function(animItem)
	{
		var phyAttr = animItem.getPhyAttr();
		if(phyWorld!=null&&phyAttr.body!=null)
		{
			phyWorld.DestroyBody(phyAttr.body);
			phyAttr.body = null;
		}
	}

	this.drawLayer = function(canvas)
	{
		for(var index in animItemPool)
		{
			animItemPool[index].draw(canvas);
		}
	}
}

ANEngine.Event.EventDispatcher = function(_obj)
{
	//{name:"",func:function}
	var events = {};
	var target = _obj;

	this.addEvent = function(name,func)
	{
		events[name] = {name:name,func:func};
	}

	this.removeEvent = function(name)
	{
		events[name] = null;
	}

	this.dispatchEvent = function(event)
	{
		if(events[event.name])
		{
			events[event.name].func(event);
		}
	}
}

ANEngine.Event.Event = function(_name,_target)
{
	this.name = _name;
	this.target = _target;
}

//click mousedown mouseup mouseover mousemoveout mousemove
//移动平台click事件用mouseup事件代替
ANEngine.Event.MouseEventDetector = function(dom)
{
	this.onclick = null;
	this.mousedown = null;
	this.mouseup = null;
	this.mouseover = null;
	this.mousemove = null;
	this.mousemoveout = null;
	var _this = this;

	var getScrollTopLeft = function() 
    { 
    	var scrollPos={}; 
    	if (typeof window.pageYOffset != undefined) { 
        	scrollPos.Top = window.pageYOffset;
        	scrollPos.Left = window.pageXOffset;
    	} 
    	else if (typeof document.compatMode != undefined
    	 && document.compatMode != 'BackCompat') { 
        	scrollPos.Top = document.documentElement.scrollTop; 
        	scrollPos.Left = document.documentElement.scrollLeft; 
    	} 
    	else if (typeof document.body != undefined) { 
        	scrollPos.Top = document.body.scrollTop; 
        	scrollPos.Left = document.body.scrollLeft; 
    	} 
    	return scrollPos; 
	}

	var click = function(e)
	{
		if(e.targetTouches)
			e = e.targetTouches[0];
		if(_this.onclick)
			_this.onclick(e,scaledPos(e));
	}

	var mousedown = function(e)
	{
		if(e.targetTouches)
			e = e.targetTouches[0];
		if(_this.mousedown)
			_this.mousedown(e,scaledPos(e));
	}

	var mouseup = function(e)
	{
		var _xy=e;
		if(e.targetTouches)
			_xy = e.targetTouches[0];
		if(_this.mouseup)
			_this.mouseup(e,scaledPos(_xy));
	}

	var mousemove = function(e)
	{
		if(e.targetTouches)
			e = e.targetTouches[0];
		if(_this.mouseover)
			_this.mouseover(e,scaledPos(e));
		if(_this.mousemoveout)
			_this.mousemoveout(e,scaledPos(e));
		if(_this.mousemove)
			_this.mousemove(e,scaledPos(e));
	}

	if(dom)
	{
		if(ANEngine.Platform=="desktop")
		{
			dom.addEventListener("mousedown",mousedown);
			dom.addEventListener("mouseup",mouseup);
			dom.addEventListener("mousemove",mousemove);
			dom.addEventListener("click",click);
		}
		else if(ANEngine.Platform=="mobile")
		{
			dom.addEventListener("touchstart",mousedown);
			dom.addEventListener("touchend",mouseup);
			dom.addEventListener("touchcancel",mouseup);
			dom.addEventListener("touchmove",mousemove);
		}
		else
		{
			dom.addEventListener("mousedown",mousedown);
			dom.addEventListener("mouseup",mouseup);
			dom.addEventListener("mousemove",mousemove);
			dom.addEventListener("click",click);

			dom.addEventListener("touchstart",mousedown);
			dom.addEventListener("touchend",mouseup);
			dom.addEventListener("touchcancel",mouseup);
			dom.addEventListener("touchmove",mousemove);
		}		
	}

	var scaledPos = function(e)
	{
		if(!e)return {x:NaN,y:NaN};
		var scrollPos = getScrollTopLeft();
		var mx=e.clientX,my=e.clientY;
		mx = (mx + scrollPos.Left)/ANEngine.drawScale;
		my = (my + scrollPos.Top)/ANEngine.drawScale;

		return {x:mx,y:my};
	}

	//检测点是否在对象内,并派发事件,区域为矩形 reverse:点在对象外时派发事件
	this.objIn = function(obj,pos,eventname,reverse)
	{
		if(!obj.dispatchEvent){
			throw "Object must extend from EventDispatcher:"+eventname;}
		else
		{
			var out = false;
			if(isNaN(pos.x)||isNaN(pos.y)||eventname=="mouseup")
				out = true;
			if(!out)
			{
				var width = obj.width,height = obj.height;
				var mx=pos.x-obj.pivotX-obj.x,my=pos.y-obj.pivotY-obj.y;
				var xcos=mx*Math.cos(-obj.rotate),xsin=mx*Math.sin(-obj.rotate),ycos=my*Math.cos(-obj.rotate),ysin=my*Math.sin(-obj.rotate);
				mx=xcos-ysin;my=xsin+ycos;
				var x1=-obj.pivotX,y1=-obj.pivotY;
				var x2=width-obj.pivotX,y2=height-obj.pivotY;//if(eventname=="mousedown")console.log(mx+","+my+"----"+x1+","+y1+";"+x2+","+y2);
			}
			if(!out&&mx>=x1&&my>=y1&&mx<=x2&&my<=y2)
			{
				if(!reverse)
				{
					if(eventname=="mousemove")
						obj.mouse_on_me = true;
					var event = new ANEngine.Event.Event(eventname,obj);
					event.x = pos.x;
					event.y = pos.y;
					obj.dispatchEvent(event);
					return true;
				}
			}
			else if(eventname=="mousemove")
			{
				obj.mouse_on_me = false;
			}
			else if(eventname=="mouseup")
			{
				obj.mouse_down = false;
				var event = new ANEngine.Event.Event(eventname,obj);
				event.x = pos.x;
				event.y = pos.y;
				obj.dispatchEvent(event);
				return true;
			}
			else if(reverse)
			{
				var event = new ANEngine.Event.Event(eventname,obj);
				event.x = pos.x;
				event.y = pos.y;
				obj.dispatchEvent(event);
				return true;
			}
			return false;
		}
	}
}

//动画缓动类型
ANEngine.Animation.TweenMode = {Linear:"Linear",Quad:"Quad",Cubic:"Cubic",Quart:"Quart",Quint:"Quint",
Sine:"Sine",Expo:"Expo",Circ:"Circ",Elastic:"Elastic",Back:"Back",Bounce:"Bounce"};
ANEngine.Animation.EasingMode = {EaseIn:"easeIn",EaseOut:"easeOut",EaseInOut:"easeInOut"};
/*
t: current time（当前时间）；
b: beginning value（初始值）；
c: change in value（变化量）；
d: duration（持续时间）
box(x:10)--->box(x:60) in 5 times
t=0,b=10,c=50,d=5
*/
//缓动函数
ANEngine.Animation.Tween = {
    Linear: function(t,b,c,d){ return c*t/d + b; },
    Quad: {
        easeIn: function(t,b,c,d){
            return c*(t/=d)*t + b;
        },
        easeOut: function(t,b,c,d){
            return -c *(t/=d)*(t-2) + b;
        },
        easeInOut: function(t,b,c,d){
            if ((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 * ((--t)*(t-2) - 1) + b;
        }
    },
    Cubic: {
        easeIn: function(t,b,c,d){
            return c*(t/=d)*t*t + b;
        },
        easeOut: function(t,b,c,d){
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        easeInOut: function(t,b,c,d){
            if ((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        }
    },
    Quart: {
        easeIn: function(t,b,c,d){
            return c*(t/=d)*t*t*t + b;
        },
        easeOut: function(t,b,c,d){
            return -c * ((t=t/d-1)*t*t*t - 1) + b;
        },
        easeInOut: function(t,b,c,d){
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        }
    },
    Quint: {
        easeIn: function(t,b,c,d){
            return c*(t/=d)*t*t*t*t + b;
        },
        easeOut: function(t,b,c,d){
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },
        easeInOut: function(t,b,c,d){
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        }
    },
    Sine: {
        easeIn: function(t,b,c,d){
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOut: function(t,b,c,d){
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOut: function(t,b,c,d){
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        }
    },
    Expo: {
        easeIn: function(t,b,c,d){
            return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
        },
        easeOut: function(t,b,c,d){
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
        easeInOut: function(t,b,c,d){
            if (t==0) return b;
            if (t==d) return b+c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
            return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
        }
    },
    Circ: {
        easeIn: function(t,b,c,d){
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
        },
        easeOut: function(t,b,c,d){
            return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        },
        easeInOut: function(t,b,c,d){
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
        }
    },
    Elastic: {
        easeIn: function(t,b,c,d,a,p){
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        },
        easeOut: function(t,b,c,d,a,p){
            if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
            if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
        },
        easeInOut: function(t,b,c,d,a,p){
            if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
            if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
            else var s = p/(2*Math.PI) * Math.asin (c/a);
            if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
        }
    },
    Back: {
        easeIn: function(t,b,c,d,s){
            if (s == undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOut: function(t,b,c,d,s){
            if (s == undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        easeInOut: function(t,b,c,d,s){
            if (s == undefined) s = 1.70158; 
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        }
    },
    Bounce: {
        easeIn: function(t,b,c,d){
            return c - ANEngine.Animation.Tween.Bounce.easeOut(d-t, 0, c, d) + b;
        },
        easeOut: function(t,b,c,d){
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        },
        easeInOut: function(t,b,c,d){
            if (t < d/2) return ANEngine.Animation.Tween.Bounce.easeIn(t*2, 0, c, d) * .5 + b;
            else return ANEngine.Animation.Tween.Bounce.easeOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
        }
    }
}


//动画插件
//speed: slow normal fast or millisec
ANEngine.Animation.Animation = function(_obj)
{
	this.target = _obj;
	var animations = new Array();
	var curAnim = null,curTotalTime = null,curFunc = null,curCallback = null,curInterval = null;

	this.animate = function(styles,speed,tween,easing,callback)
	{
		animations.push({styles:styles,speed:speed,tween:tween,easing:easing,callback:callback});
		return this;
	}

	this.delay = function(dur)
	{
		animations.push({styles:"delay",delay:dur});
		return this;
	}

	//interval和timeout每秒200次计算封顶。。。
	this.update = function()
	{
		//确定每轮缓动的基本参数
		if(curAnim==null&&animations.length>0)
		{
			curAnim = animations.shift();
			if(curAnim.styles=="delay")
			{
				setTimeout(function(){curAnim=null;},curAnim.delay);
				return;
			}
			//确定速度
			if(curAnim.speed=="slow")
				curTotalTime = 3000;
			else if(curAnim.speed=="normal")
				curTotalTime = 1500;
			else if(curAnim.speed=="fast")
				curTotalTime = 500;
			else if(!isNaN(curAnim.speed))
				curTotalTime = curAnim.speed;
			else
			{
				throw "Unkown speed";
				return;
			}
			//确定缓动函数
			if(curAnim.tween=="Linear")
				curFunc = ANEngine.Animation.Tween["Linear"];
			else
				curFunc = ANEngine.Animation.Tween[curAnim.tween][curAnim.easing];

			if(!curFunc)
			{
				throw "Wrong tween type or easing type";
				return;
			}
			curCallback = curAnim.callback;
			var target = this.target;
			var decision = 10;//计算次数，取style最大值
			var ini_styles = {};
			var target_styles = {};
			for(var style in curAnim.styles)
			{
				ini_styles[style] = target[style];
				target_styles[style] = curAnim.styles[style] - target[style];
				if(Math.ceil(Math.abs(target_styles[style]))>decision)
					decision = Math.abs(target_styles[style])*10;
			}
			decision = decision>200?200:decision;
			var t = 0,step = curTotalTime/decision;
			var Run = function(){
				for(var style in curAnim.styles)
				{
					target[style] = curFunc(t,ini_styles[style],target_styles[style],decision);
					//console.log(style+","+target[style]+",t:"+t+",decision:"+decision);
				}
				if(t<decision)
				{
					t++;
					setTimeout(Run,step);
				}
				else
				{
					if(curCallback)
						curCallback();
					curCallback = null;
					curAnim = null;
				}
			};
			Run();
		}
	}
}

//可视元素基类
ANEngine.DisplayObject = function(_x,_y,_width,_height,_rotate)
{
	ANEngine.Event.EventDispatcher.call(this,this);

	this.x = _x;
	this.y = _y;
	this.pivotX = _width/2;//旋转轴心
	this.pivotY = _height/2;
	this.width = _width;
	this.height = _height;
	this.rotate = _rotate==undefined?0:_rotate;//旋转弧度
	this.alpha = 1;
	this.blend = "source_over";
	this.scaleW=1;
	this.scaleH=1;
	this.func = null;
	this.layer = null;
	this.drawBorder = false;//是否画边框，物理边框为红色，sprite边框为蓝色
	this.animation = new ANEngine.Animation.Animation(this);

	this.canvasDraw = function(canvas,vertices)
	{
		var drawScale = ANEngine.drawScale;
		canvas.beginPath();
		canvas.moveTo(vertices[0].x*drawScale,vertices[0].y*drawScale);
		for(var i=1;i<vertices.length;i++)
		{
			canvas.lineTo(vertices[i].x*drawScale,vertices[i].y*drawScale);
		}
		canvas.lineTo(vertices[0].x*drawScale,vertices[0].y*drawScale);
		canvas.stroke();
	}

	this.canvasDrawCircle = function(canvas,radius,center)
	{
		var drawScale = ANEngine.drawScale;
		cx = center.x * drawScale,
        cy = center.y * drawScale;
      	canvas.moveTo(0, 0);
      	canvas.beginPath();
      	canvas.arc(cx, cy, radius * drawScale, 0, Math.PI * 2, true);
      	canvas.closePath();
      	canvas.stroke();
	}

	//红色
	this.drawPhyBorder = function(canvas,_sprite)
	{
		canvas.save();
		var drawScale = ANEngine.drawScale;
		var x=this.x*drawScale,y=this.y*drawScale,pivotX=this.pivotX*drawScale,
		pivotY=this.pivotY*drawScale;//,width=this.width*drawScale,height=this.height*drawScale;
		var translateX = x+pivotX,translateY = y+pivotY;
		//应用位移和旋转
		canvas.translate(translateX,translateY);
		canvas.rotate(-this.rotate);
		canvas.translate(-translateX,-translateY);

		canvas.strokeStyle = "#ff0000";
		var sprite = _sprite||this;
		var drawScale = ANEngine.drawScale;
		var body = sprite.physicalSkin.getPhyAttr().body;
		if(body)
		{
			if(sprite.physicalSkin.getPhyAttr().shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Box)
			{
				var localVertices = body.GetFixtureList().GetShape().GetVertices();
				var vertices = Array(localVertices.length);
				var xf = body.m_xf;
				for(var i in localVertices)
				{
					vertices[i] = localVertices[i];
					vertices[i] = Box2D.Common.Math.b2Math.MulX(xf, vertices[i]);
				}
				sprite.canvasDraw(canvas,vertices);
			}
			else if(sprite.physicalSkin.getPhyAttr().shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Circle)
			{
				radius = body.GetFixtureList().GetShape().m_radius;
				var center = Box2D.Common.Math.b2Math.MulX(body.m_xf,body.GetFixtureList().GetShape().m_p);
				sprite.canvasDrawCircle(canvas,radius,center);
			}
		}
		canvas.restore();
	}

	//蓝色
	this.drawSelfBorder = function(canvas,_sprite)
	{
		canvas.save();
		canvas.strokeStyle = "#0000ff";
		var sprite = _sprite||this;
		var drawScale = ANEngine.drawScale;
		canvas.beginPath();
		canvas.moveTo(sprite.x*drawScale,sprite.y*drawScale);
		canvas.lineTo(sprite.width*drawScale+sprite.x*drawScale,sprite.y*drawScale);
		canvas.lineTo(sprite.width*drawScale+sprite.x*drawScale,sprite.height*drawScale+sprite.y*drawScale);
		canvas.lineTo(sprite.x*drawScale,sprite.height*drawScale+sprite.y*drawScale);
		canvas.lineTo(sprite.x*drawScale,sprite.y*drawScale);
		canvas.closePath();
		canvas.stroke();
		canvas.restore();	
	}

	this.preDraw = function(canvas)
	{
		this.animation.update();
		var drawScale = ANEngine.drawScale;
		//计算像素单位
		var _x=this.x*drawScale,_y=this.y*drawScale,_pivotX=this.pivotX*drawScale,
		_pivotY=this.pivotY*drawScale,_width=this.width*drawScale,_height=this.height*drawScale;
		var translateX = _x+_pivotX,translateY = _y+_pivotY;
		//应用位移和旋转
		canvas.translate(translateX,translateY);
		canvas.rotate(this.rotate);
		canvas.translate(-translateX,-translateY);
		if(this.func!=null)
			this.func(canvas,this);
		if(this.drawBorder)
		{
			this.drawPhyBorder(canvas);
			this.drawSelfBorder(canvas);
		}
		//设置透明度
		canvas.globalAlpha = this.alpha;
		//设置混色
		canvas.globalCompositeOperation = this.blend;
		//缩放
		canvas.translate(translateX,translateY);
		canvas.scale(this.scaleW,this.scaleH);
		canvas.translate(-translateX,-translateY);
	}

	this.draw = function(canvas){}

	this.DisplayObject_Clone = function()
	{
		var co = new this.constructor(this.x,this.y,this.width,this.height,this.rotate);
		co.pivotX = this.pivotX;
		co.pivotY = this.pivotY;
		co.alpha = this.alpha;
		co.blend = this.blend;
		co.scaleW = this.scaleW;
		co.scaleH = this.scaleH;
		co.layer = this.layer;
		return co;
	}
}

ANEngine.Sprite = function(_x,_y,_width,_height,_rotate)
{
	ANEngine.DisplayObject.call(this,_x,_y,_width,_height,_rotate);

	var image = null;//贴图,加载完后调用setChartlet()设置
	var imageCut = {use:false,sx:0,sy:0,swidth:0,sheight:0};
	this.physicalSkin = new ANEngine.physicalEngine.PhysicalSkin(this);

	this.setChartlet = function(_image,scut)
	{
		image = _image;
		if(scut)
			scut.use = true;
		imageCut = scut||imageCut;
	}

	this.draw = function(canvas)
	{
		var phyAttr = this.physicalSkin.getPhyAttr();
		if(this.physicalSkin.EnabledPhy()&&phyAttr.body!=null)
		{
			this.x = phyAttr.body.GetPosition().x-this.width/2;
			this.y = phyAttr.body.GetPosition().y-this.height/2;
			this.rotate = phyAttr.body.GetAngle();
		}
		canvas.save();
		this.preDraw(canvas);//调用基类的预处理
		if(image!=null)
		{
			if(imageCut.use)
				canvas.drawImage(image,imageCut.sx,imageCut.sy,imageCut.swidth,imageCut.sheight,
					this.x*ANEngine.drawScale,
					this.y*ANEngine.drawScale,
					this.width*ANEngine.drawScale,
					this.height*ANEngine.drawScale);
			else
				canvas.drawImage(image,
					this.x*ANEngine.drawScale,
					this.y*ANEngine.drawScale,
					this.width*ANEngine.drawScale,
					this.height*ANEngine.drawScale);
		}
		canvas.restore();
	}

	this.Clone = function()
	{
		var co = this.DisplayObject_Clone();
		co.setChartlet(image,imageCut.use?imageCut:null);
		//co.physicalSkin = physicalSkin.Clone();
		return co;
	}
}

//影片剪辑
ANEngine.MovieClip = function(_x,_y,_width,_height,_rotate)
{
	ANEngine.DisplayObject.call(this,_x,_y,_width,_height,_rotate);
	var spriteSheetData = [];
	var image = null;
	var _totalFrame = 0;
	var _curFrame = 0;
	var fps = 0;//影片剪辑的帧率
	var isPlay = true;
	var lastFrameTime = 0;//播放前一帧的时间
	var data = null;
	this.monitor = null;//回调函数，监控每一帧 传递当前帧编号（1开始）和当前MovieClip对象
	this.physicalSkin = new ANEngine.physicalEngine.PhysicalSkin(this);

	this.setSpriteSheet = function(_image,_data,_fps)
	{
		fps = _fps||ANEngine.fps;
		var i = 0;
		spriteSheetData = [];
		for(var index in _data.frames)
		{
			var frame = {name:i,frameData:_data.frames[index]};
			spriteSheetData.push(frame);
			i++;
		}
		data = _data;
		_totalFrame = i;
		image = _image;
		totalFrame = spriteSheetData.length;
	}

	this.totalFrame = function()
	{
		return _totalFrame;
	}

	this.curFrame = function()
	{
		return _curFrame;
	}

	this.stop = function()
	{
		isPlay = false;
	}

	this.start = function()
	{
		isPlay = true;
	}

	this.gotoAndPlay = function(num)
	{
		_curFrame = num-1;
		isPlay = true;
	}

	this.gotoAndStop = function(num)
	{
		_curFrame = num-1;
		isPlay = false;
	}

	this.draw = function(canvas)
	{
		var phyAttr = this.physicalSkin.getPhyAttr();
		if(this.physicalSkin.EnabledPhy()&&phyAttr.body!=null)
		{
			this.x = phyAttr.body.GetPosition().x-this.width/2;
			this.y = phyAttr.body.GetPosition().y-this.height/2;
			this.rotate = phyAttr.body.GetAngle();
		}
		canvas.save();
		this.preDraw(canvas);//调用基类的预处理
		if(image!=null)
		{
			var curTime = new Date().getTime();
			var interval = curTime-lastFrameTime;
			var frame = spriteSheetData[_curFrame].frameData;
			canvas.drawImage(image,frame.frame.x,frame.frame.y,frame.frame.w,frame.frame.h,
					this.x*ANEngine.drawScale,
					this.y*ANEngine.drawScale,
					this.width*ANEngine.drawScale,
					this.height*ANEngine.drawScale);
			if(!fps||interval>=1000/fps)
			{
				lastFrameTime = curTime;
				if(isPlay)
				{
					_curFrame = ++_curFrame>=_totalFrame?0:_curFrame;
				}
			}
			if(this.monitor&&isPlay)
				this.monitor(_curFrame+1,this);
		}
		canvas.restore();
	}

	this.Clone = function()
	{
		var co = this.DisplayObject_Clone();
		co.setSpriteSheet(image,data,fps);
		//co.physicalSkin = physicalSkin.Clone();
		return co;
	}
}
/*
font:

textAlign:
	start	默认。文本在指定的位置开始。
	end	文本在指定的位置结束。
	center	文本的中心被放置在指定的位置。
	left	文本左对齐。
	right	文本右对齐。

textBaseline:
	alphabetic	默认。文本基线是普通的字母基线。
	top	文本基线是 em 方框的顶端。
	hanging	文本基线是悬挂基线。
	middle	文本基线是 em 方框的正中。
	ideographic	文本基线是表意基线。
	bottom	文本基线是 em 方框的底端。
*/
ANEngine.Widget.TextStyle = function(font,textAlign,textBaseline,fillStyle,strokeStyle)
{
	this.font = font;
	this.textAlign = textAlign;
	this.textBaseline = textBaseline;
	this.fillStyle = fillStyle;
	this.strokeStyle = strokeStyle;

	this.Clone = function()
	{
		var style = new ANEngine.Widget.TextStyle(this.font,this.textAlign,this.textBaseline,this.fillStyle,this.strokeStyle);
		return style;
	}
}
ANEngine.Widget.Text = function(text,_x,_y,_width,_height,_rotate)
{
	ANEngine.DisplayObject.call(this,_x,_y,_width,_height,_rotate);
	this.text = text;
	this.drawstyle = 1;//1：填充，2：镂空，3：填充和镂空
	this.textStyle = null;
	this.physicalSkin = new ANEngine.physicalEngine.PhysicalSkin(this);

	this.draw = function(canvas)
	{
		var phyAttr = this.physicalSkin.getPhyAttr();
		if(this.physicalSkin.EnabledPhy()&&phyAttr.body!=null)
		{
			this.x = phyAttr.body.GetPosition().x-this.width/2;
			this.y = phyAttr.body.GetPosition().y-this.height/2;
			this.rotate = phyAttr.body.GetAngle();
		}
		canvas.save();
		this.preDraw(canvas);//调用基类的预处理
		if(this.textStyle)
		{
			if(this.textStyle.font)
				canvas.font = this.textStyle.font
			if(this.textStyle.textAlign)
				canvas.textAlign = this.textStyle.textAlign;
			if(this.textStyle.textBaseline)
				canvas.textBaseline = this.textStyle.textBaseline;
			if(this.drawstyle==1||this.drawstyle==3)
				canvas.fillStyle = this.textStyle.fillStyle;
			if(this.drawstyle==2||this.drawstyle==3)
				canvas.strokeStyle = this.textStyle.strokeStyle;
		}
		this.width = canvas.measureText(this.text).width/ANEngine.drawScale;
		if(this.drawstyle==2||this.drawstyle==3)
			canvas.strokeText(this.text,this.x*ANEngine.drawScale,this.y*ANEngine.drawScale);
		if(this.drawstyle==1||this.drawstyle==3)
			canvas.fillText(this.text,this.x*ANEngine.drawScale,this.y*ANEngine.drawScale);
		canvas.restore();
	}

	this.Clone = function()
	{
		var co = this.DisplayObject_Clone();
		co.text=this.text;
		co.textStyle=this.textStyle;
		return co;
	}
}

//粒子
ANEngine.Particle.Particle = function(displayObject)
{
	this.dObject = displayObject;

	this.PUBLIC_SCALEX_VALUE = 0;
    this.PUBLIC_SCALEY_VALUE = 0;
 
    this.PUBLIC_A_VALUE = 0
 
    this.PUBLIC_ANGLE_VALUE = 0;
    this.PUBLIC_ROTATION_VALUE = 0
 
    this.PUBLIC_SPEED_VALUE = 0;
    this.PUBLIC_ALPHA_VALUE=0;

    this.draw=function()
    {
 
        //让角度加上旋转角度
        this.PUBLIC_ROTATION_VALUE += this.PUBLIC_ANGLE_VALUE;
 
        //让粒子按照指定的速度和方向运动
        this.dObject.x = this.dObject.x+Math.cos(this.PUBLIC_ROTATION_VALUE) * this.PUBLIC_SPEED_VALUE;
        this.dObject.y = this.dObject.y+Math.sin(this.PUBLIC_ROTATION_VALUE) *this.PUBLIC_SPEED_VALUE;
 
        this.dObject.scaleX = this.dObject.scaleX+this.PUBLIC_SCALEX_VALUE;
        this.dObject.scaleY = this.dObject.scaleY+this.PUBLIC_SCALEY_VALUE;
 
        //所有属性加上某个值
        this.dObject.alpha = this.dObject.alpha+this.PUBLIC_ALPHA_VALUE;
 
        //如果透明度小于0就清理粒子
        if (this.dObject.alpha<= 0)
        {
            this.clear();
        }
        this.dObject.draw();
    }

     //初始化粒子的所有状态
    this.show=function()
    {
        this.dObject.alpha = 1;
        this.dObject.scaleX = 1;
        this.dObject.scaleX = 1;
        this.PUBLIC_START = true;
    }

    /**
     * 清理粒子
     */
    this.clear=function()
    {
        this.dObject.alpha = 0;
        this.PUBLIC_START = false;
    }
}

//粒子发射器
//粒子对象，发射器属性值，粒子数
ANEngine.Particle.ParticleEmitter = function(displayObject,pLauncher,pNum)
{

	var particles = [];
	var particle_num = pNum;
	var dObject = displayObject;
	this.launcher = pLauncher;
	for(var i=0;i<pNum;i++)
	{
		particles.push(new ANEngine.Particle.Particle(displayObject.Clone()));
	}

	initParticles();

	var initParticles = function()
	{
		for(var i in particles)
		{
            //填充粒子属性
            var particle = particle[i];
            particle.show();
            particle.PUBLIC_A_VALUE = this.launcher.PUBLIC_A_VALUE;
 
            particle.PUBLIC_ANGLE_VALUE = this.launcher.PUBLIC_ANGLE_VALUE;
            particle.PUBLIC_ALPHA_VALUE = this.launcher.PUBLIC_ALPHA_VALUE;
            particle.PUBLIC_SCALEX_VALUE = this.launcher.PUBLIC_SCALEX_VALUE;
            particle.PUBLIC_SCALEY_VALUE = this.launcher.PUBLIC_SCALEY_VALUE;
            particle.PUBLIC_ROTATION_VALUE = this.launcher.PUBLIC_ROTATION_VAlUE + Math.random() * this.launcher.PUBLIC_ROTATION_RANDOM;
            particle.PUBLIC_SPEED_VALUE = this.launcher.PUBLIC_SPEED_VALUE;
		}
	}

	this.resetParticles = function(displayObject,_pNum)
	{
		pNum = _pNum||pNum;
		particles = [];
		dObject = displayObject;
		for(var i=0;i<pNum;i++)
		{
			particles.push(displayObject.Clone());
		}
		initParticles();
	}

	this.draw = function(canvas)
	{
		for(var i in particles)
		{
			if(particles[i].PUBLIC_START)
				particles[i].draw();
		}
	}
}

//发射器属性
ANEngine.Particle.Launcher = function()
{
	//粒子出生X坐标
    this.PUBLIC_X = 0;
 
    //粒子出生Y坐标
    this.PUBLIC_Y = 0;
 
    //粒子X随机范围
    this.PUBLIC_SCOPE_X = 0;
 
    //粒子Y随机范围
    this.PUBLIC_SCOPE_Y = 0;
 
    //粒子X比例缩放值
    this.PUBLIC_SCALEX_VALUE = 0;
 
    //粒子Y比例缩放值
    this.PUBLIC_SCALEY_VALUE =0;
 
    //粒子角度递增值
    this.PUBLIC_ANGLE_VALUE = 0;
 
    //粒子初始化角度
    this.PUBLIC_ROTATION_VAlUE = 0
 
    //粒子随机角度
    this.PUBLIC_ROTATION_RANDOM = 0;
 
    //粒子运动速度
    this.PUBLIC_SPEED_VALUE = 0
 
    //粒子初始化透明度
    this.PUBLIC_ALPHA_VALUE=1;
 
    //粒子递增颜色值
    this.PUBLIC_A = 1
}

ANEngine.Camera.BaseCamera = function(_far,_x,_y)
{
	this.far = _far||30;
	this.x = _x==undefined?0:_x;
	this.y = _y==undefined?0:_y;

	this.update = function(){}
}

//only lookAt setFar can transform hovercamera
ANEngine.Camera.HoverCamera = function(_far,_x,_y)
{
	ANEngine.Camera.BaseCamera.call(this,_far,_x,_y);
	var lookAtX = this.x,lookAtY = this.y,lookAtFar = this.far;
	this.maxVelocity = .5;
	this.maxVelocityFar = 1;
	var velocityX = 0,velocityY = 0,velocityFar = 0;
	var lenX = 0,lenY=0,lenFar=0;
	var signX=1,signY=1,signF=1;
	var bindObj = null;
	this.bindObjOffsetX=0;
	this.bindObjOffsetY=0;

	this.bind = function(display_obj)
	{
		bindObj = display_obj;
	}

	this.unbind = function()
	{
		bindObj = null;
	}

	this.lookAt = function(x,y)
	{
		lookAtX = x;
		lookAtY = y;
		lenX = Math.abs(lookAtX-this.x)+0.0001;
		lenY = Math.abs(lookAtY-this.y)+0.0001;
		signX = Math.floor((lookAtX-this.x)/lenX+0.1);
		signY = Math.floor((lookAtY-this.y)/lenY+0.1);
	}

	this.setFar = function(far)
	{
		lookAtFar = far;
		lenFar = Math.abs(lookAtFar-this.far)+0.0001;
		signF = Math.floor((lookAtFar-this.far)/lenFar+0.1);
	}

	this.update = function()
	{
		if(bindObj)
		{
			this.lookAt(bindObj.x-this.bindObjOffsetX,bindObj.y-this.bindObjOffsetY);
		}
		var disX = Math.abs(lookAtX-this.x);
		var disY = Math.abs(lookAtY-this.y);
		var disFar = Math.abs(lookAtFar-this.far);
		var movX = lenX-disX;
		var movY = lenY-disY;
		var movF = lenFar-disFar;
		velocityX = (1-movX/lenX)*this.maxVelocity;
		velocityY = (1-movY/lenY)*this.maxVelocity;
		velocityFar = (1-movF/lenFar)*this.maxVelocityFar;//console.log(velocityX+","+velocityY+","+velocityFar);
		this.x += signX*(disX>velocityX?velocityX:disX);
		this.y += signY*(disY>velocityY?velocityY:disY);
		this.far += signF*(disFar>velocityFar?velocityFar:disFar);
	}
}

/*
	针对box2d进行封装
*/
ANEngine.physicalEngine.Box2d = {
	b2World:Box2D.Dynamics.b2World,
	b2Vec2:Box2D.Common.Math.b2Vec2,
	b2AABB:Box2D.Collision.b2AABB,
    b2BodyDef:Box2D.Dynamics.b2BodyDef,
    b2Body:Box2D.Dynamics.b2Body,
    b2FixtureDef:Box2D.Dynamics.b2FixtureDef,
    b2Fixture:Box2D.Dynamics.b2Fixture,
    b2MassData:Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape:Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape:Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw:Box2D.Dynamics.b2DebugDraw,
    b2MouseJointDef:Box2D.Dynamics.Joints.b2MouseJointDef,
    b2Transform:Box2D.Common.Math.b2Transform,
    b2Mat22:Box2D.Common.Math.b2Mat22,
    b2RevoluteJointDef:Box2D.Dynamics.Joints.b2RevoluteJointDef,
};

ANEngine.physicalEngine.PhysicsAttr = {
	Type:{Static:ANEngine.physicalEngine.Box2d.b2Body.b2_staticBody,Dynamic:ANEngine.physicalEngine.Box2d.b2Body.b2_dynamicBody},
	Shape:{Box:"Box",Circle:"Circle"},
	CircleAlign:{IN:"IN",OUT:"OUT"},
};

//AnimItem的物理属性
ANEngine.physicalEngine.PhysicalSkin = function(_sprite)
{
		var _this = _sprite;
		var enabledPhy = false;
		/*
			若Sprite的物理外形为圆，
			IN：Sprite在圆内，四角与圆相接
			OUT：圆在Sprite内，圆与Sprite相切
		*/
		var phyAttr = {};

		phyAttr.type = ANEngine.physicalEngine.PhysicsAttr.Type.Static;
		phyAttr.shape = ANEngine.physicalEngine.PhysicsAttr.Shape.Box;
		phyAttr.density = 50;
		phyAttr.friction = .5;
		phyAttr.restitution = .3;
		phyAttr.bodyDef = null;
		phyAttr.body = null;
		phyAttr.fixture = null;
		phyAttr.circleAlign = ANEngine.physicalEngine.PhysicsAttr.CircleAlign.OUT;

		this.getPhyAttr = function()
		{
			return phyAttr;
		}

		this.EnabledPhy = function()
		{
			return enabledPhy;
		}

		//在layer被添加进场景后此函数才有效
		this.addToPhyWorld = function()
		{
			if(_this.layer!=null)
			{
				_this.layer.addAnimItemPhy(this);
				enabledPhy = true;
			}
		}

		//在layer被添加进场景后此函数才有效
		this.updatePhy = function()
		{
			if(_this.layer!=null)
			{
				_this.layer.updateAnimItemPhy(this);
				enabledPhy = true;
			}
		}

		//在layer被添加进场景后此函数才有效
		this.destroyPhy = function()
		{
			if(_this.layer!=null)
			{
				_this.layer.destroyAnimItemPhy(this);
				enabledPhy = false;
			}
		}

		this.setAwakePhy = function(awake)
		{
			var body = this.getPhyAttr().body;
			if(body)
			{
				body.SetAwake(awake);
			}
		}

		this.applyForceToCenterPhy = function(x,y)
		{
			var body = this.getPhyAttr().body;
			if(body)
			{
				body.ApplyForce(new ANEngine.physicalEngine.Box2d.b2Vec2(x,y),
					new ANEngine.physicalEngine.Box2d.b2Vec2(body.GetPosition().x,
						body.GetPosition().y));
			}
		}

		this.applyForcePhy = function(x,y,px,py)
		{
			var body = this.getPhyAttr().body;
			if(body)
			{
				body.ApplyForce(new ANEngine.physicalEngine.Box2d.b2Vec2(x,y),
					new ANEngine.physicalEngine.Box2d.b2Vec2(px,
						py));
			}
		}

		//如果开启了物理模拟，改变位置和角度用此函数
		this.setTransformPhy = function(x,y,angle)
		{
			var body = this.getPhyAttr().body;
			var Box2d = ANEngine.physicalEngine.Box2d;
			angle = angle==undefined?0:angle;
			if(body)
			{
				_this.x = x;
				_this.y = y;
				_this.rotate = angle;
				body.SetTransform(new ANEngine.physicalEngine.NormalPA(x,y,angle));
			}
		}

		//Joint Transform
		this.setJointTransform = function(x,y,force)
		{
			if(phyAttr.body)
			{
				force = force||300.0;
				var md = new ANEngine.physicalEngine.Box2d.b2MouseJointDef();
            	md.bodyA = _this.layer.scene.phyWorld.GetGroundBody();
            	md.bodyB = phyAttr.body;
            	md.target.Set(x, y);
            	md.collideConnected = true;
            	md.maxForce = force * phyAttr.body.GetMass();
            	mouseJoint = _this.layer.scene.phyWorld.CreateJoint(md);
            	phyAttr.body.SetAwake(true);
        	}
		}

		//需要在添加物理外形前调用
		this.setPhysics = function(phyData)
		{
			var Box2d = ANEngine.physicalEngine.Box2d;

			var shape = phyData.shape;//* 
			var type = phyData.type;//default static
			var phyAlign = phyData.phyAlign;//if circle
			var density = phyData.density;
			var friction = phyData.friction;
			var restitution = phyData.restitution;
			var angle = _this.rotate;
			var x = _this.x,y = _this.y,width = _this.width,height = _this.height;
			//console.log(x+","+y+","+width+","+height+","+angle);
			phyAttr.shape = shape||phyAttr.shape;
			phyAttr.type = type||phyAttr.type;
			phyAttr.density = density||phyAttr.density;
			phyAttr.friction = friction||phyAttr.friction;
			phyAttr.restitution = restitution||phyAttr.restitution;
			phyAttr.circleAlign = phyAlign||phyAttr.circleAlign;

			phyAttr.bodyDef = new Box2d.b2BodyDef();
			phyAttr.bodyDef.type = phyAttr.type;
			phyAttr.bodyDef.position.Set(x+width/2,y+height/2);
			phyAttr.bodyDef.angle = angle;
			phyAttr.fixture = new Box2d.b2FixtureDef();
			phyAttr.fixture.density = phyAttr.density;
			phyAttr.fixture.friction = phyAttr.friction;
			phyAttr.fixture.restitution = phyAttr.restitution;
			if(shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Box)
			{
				phyAttr.fixture.shape = new Box2d.b2PolygonShape();
				phyAttr.fixture.shape.SetAsBox(width/2,height/2);
			}
			else if(shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Circle)
			{
				var radius = 0;
				if(phyAttr.circleAlign==ANEngine.physicalEngine.PhysicsAttr.CircleAlign.IN)
				{
					radius = Math.sqrt(width*width+height*height)/2;
				}
				else if(phyAttr.circleAlign==ANEngine.physicalEngine.PhysicsAttr.CircleAlign.OUT)
				{
					radius = width<height?width/2:height/2;
				}

				phyAttr.fixture.shape = new Box2d.b2CircleShape(radius);
			}
		}
}

//物理容器
ANEngine.physicalEngine.Container = function(_phyWorld)
{
	//[{item:,index:}...]
	var display_objects = new Array();
	this.physicalShape = null; 
	this.phyWorld = _phyWorld;

	this.addChild = function(item,index,sort)
	{
		index = index||1;
		sort = sort==undefined?true:sort;
		display_objects.push({item:item,index:index});
		if(sort)
			display_objects.sort(function(a,b){
				return b.index-a.index;
			});
	}

	this.addChildren = function(children,sort)
	{
		display_objects = display_objects.concat(children);
		sort = sort==undefined?true:sort;
		if(sort)
			display_objects.sort(function(a,b){
				return b.index-a.index;
			});
	}

	this.border = function(border_on)
	{
		for(var i in display_objects)
		{
			display_objects[i].item.drawBorder = border_on;
		}
	}

	//暂时保留
	this.draw = function(canvas)
	{
		for(var i in display_objects)
		{
			display_objects[i].item.draw(canvas);
		}
	}

	this.createPhysicalShape = function(physhape)
	{
		this.physicalShape = physhape.initialize(display_objects,this.phyWorld);
	}

	this.destroyPhysicalShape = function()
	{
		if(this.physicalShape)
		{
			for(var i in this.physicalShape.joints)
				this.phyWorld.DestroyJoint(this.physicalShape.joints[i]);
		}
	}
}

//物理形状
ANEngine.physicalEngine.ComplexShape.PhysicalShape = function()
{
	this.display_objects = null;
	this.body_array = new Array();
	this.phyWorld = null;

	this._initialize = function(_display_objects,_phyWorld)
	{
		this.phyWorld = _phyWorld;
		this.display_objects = _display_objects;
		return this;
	}

	this.initialize = function(_display_objects,_phyWorld)
	{
		return this._initialize(_display_objects);
	}
}

//桥 set config.anchor_offset={x:x,y:y} to change bridge node anchor point
ANEngine.physicalEngine.ComplexShape.BridgeShape = function()
{
	ANEngine.physicalEngine.ComplexShape.PhysicalShape.call(this);
	var Box2d = ANEngine.physicalEngine.Box2d;
	var jointDef = null;
	this.config = {};
	this.joints = new Array();

	this.initialize = function(_display_objects,_phyWorld)
	{
		this._initialize(_display_objects,_phyWorld);
		if(this.display_objects.length==1)
			return this;
		jointDef = new Box2d.b2RevoluteJointDef();
		for(var i in this.config)
			jointDef[i] = this.config[i];
		if(!this.config.anchor_offset)
			this.config.anchor_offset = {};
		if(!this.config.anchor_offset.x)
			this.config.anchor_offset.x = 0;
		if(!this.config.anchor_offset.y)
			this.config.anchor_offset.y = 0;
		var _x=0,_y=0;
		for(var i=0;i<this.display_objects.length-1;i++)
		{
			var anchor = this.display_objects[i+1].item.physicalSkin.getPhyAttr().body.GetPosition();
			anchor.x = anchor.x - this.config.anchor_offset.x-_x;
			anchor.y = anchor.y - this.config.anchor_offset.y-_y;
			_x = _x + this.config.anchor_offset.x;_y = _y + this.config.anchor_offset.y;
			jointDef.Initialize(this.display_objects[i].item.physicalSkin.getPhyAttr().body,
				this.display_objects[i+1].item.physicalSkin.getPhyAttr().body,
				anchor);
			this.joints.push(this.phyWorld.CreateJoint(jointDef));
		}
		return this;
	}
}


ANEngine.physicalEngine.createWorld = function(direcX,direcY)
{
	var Box2d = ANEngine.physicalEngine.Box2d;
	return new Box2d.b2World(new Box2d.b2Vec2(direcX, direcY),true);
}

ANEngine.physicalEngine.step = function(world,timeStep,velocityIterations,positionIterations)
{
	velocityIterations = velocityIterations||10;
	positionIterations = positionIterations||10;

	world.Step(timeStep,velocityIterations,positionIterations);
}

//Box2d物体位置描述对象
ANEngine.physicalEngine.NormalPA = function(x,y,angle)
{
	this.position = {x:x,y:y};
	this.angle = angle;

	this.GetAngle = function()
	{
		return this.angle;
	}
}
