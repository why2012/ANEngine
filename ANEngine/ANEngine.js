/**
	Auhtor:WHY
	Description:a simple 2d engine binded with box2d
*/
var ANEngine = function()
{

}

ANEngine.drawScale = 30;//一单位对应30像素
ANEngine.fps = 60;
//物理引擎采用box2d
ANEngine.physicalEngine = {};
ANEngine.physicalEngine.velocityIterations = 10;
ANEngine.physicalEngine.positionIterations = 10;
ANEngine.physicalEngine.gravity = {x:0,y:10};

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
		var width = _canvas.width;
		var height = _canvas.height;
		var canvas = _canvas.getContext("2d");
		var layers = new Array();
		var backgroud = null;
		this.phyWorld = ANEngine.physicalEngine.createWorld(ANEngine.physicalEngine.gravity.x,ANEngine.physicalEngine.gravity.y);

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

		//场景绘制
		this.drawScene = function()
		{
			canvas.clearRect(0,0,width,height);
			if(backgroud!=null)
				canvas.drawImage(backgroud,0,0,width,height);
			for(var index in layers)
			{
				layers[index].drawLayer(canvas);
			}
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

		this.setPhyWorld = function(world)
		{
			phyWorld = world;
		}

		//添加可视元素
		this.addAnimItem = function(animItem)
		{
			animItemPool.push(animItem);
			animItem.layer = this;
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

//可视元素基类
ANEngine.DisplayObject = function(_x,_y,_width,_height,_rotate)
{
	var x = _x;
	var y = _y;
	var pivotX = _width/2;//旋转轴心
	var pivotY = _height/2;
	var width = _width;
	var height = _height;
	var rotate = _rotate==undefined?0:_rotate;//旋转弧度
	var alpha = 1;
	var blend = "source_over";
	var scaleW=1,scaleH=1;
	this.func = null;
	this.layer = null;
	this.drawBorder = false;//是否画边框，物理边框为红色，sprite边框为蓝色

	this.x = function(_x)
	{
		x = _x||x;
		x = x==undefined?0:x;
		return x;
	}

	this.y = function(_y)
	{
		y = _y||y;
		y = y==undefined?0:y;
		return y;
	}

	this.width = function(_width)
	{
		width = _width||width;
		width = width==undefined?0:width;
		pivotX = width/2;
		return width;
	}

	this.height = function(_height)
	{
		height = _height||height;
		height = height==undefined?0:height;
		pivotY = height/2;
		return height;
	}

	this.pivotX = function(_pivotX)
	{
		pivotX = _pivotX||pivotX;
		pivotX = pivotX==undefined?0:pivotX;
		return pivotX;
	}

	this.pivotY = function(_pivotY)
	{
		pivotY = _pivotY||pivotY;
		pivotY = pivotY==undefined?0:pivotY;
		return pivotY;
	}

	this.rotate = function(_rotate)
	{
		rotate = _rotate||rotate;
		rotate = rotate==undefined?0:rotate;
		return rotate;
	}

	this.alpha = function(_alpha)
	{
		alpha = _alpha||alpha;
		alpha = alpha==0?0:alpha;
		return alpha;
	}

	this.blend = function(_blend)
	{
		blend = _blend||blend;
		return blend;
	}

	this.scale = function(sw,sh)
	{
		scaleW = sw||scaleW;
		scaleH = sh||scaleH;
		return {scaleW:scaleW,scaleH:scaleH};
	}

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
		var x=this.x()*drawScale,y=this.y()*drawScale,pivotX=this.pivotX()*drawScale,
		pivotY=this.pivotY()*drawScale,width=this.width()*drawScale,height=this.height()*drawScale;
		var translateX = x+pivotX,translateY = y+pivotY;
		//应用位移和旋转
		canvas.translate(translateX,translateY);
		canvas.rotate(-rotate);
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
		canvas.moveTo(sprite.x()*drawScale,sprite.y()*drawScale);
		canvas.lineTo((sprite.width()+sprite.x())*drawScale,sprite.y()*drawScale);
		canvas.lineTo((sprite.width()+sprite.x())*drawScale,(sprite.height()+sprite.y())*drawScale);
		canvas.lineTo(sprite.x()*drawScale,(sprite.height()+sprite.y())*drawScale);
		canvas.lineTo(sprite.x()*drawScale,sprite.y()*drawScale);
		canvas.closePath();
		canvas.stroke();
		canvas.restore();	
	}

	this.preDraw = function(canvas)
	{
		var drawScale = ANEngine.drawScale;
		//计算像素单位
		var _x=x*drawScale,_y=y*drawScale,_pivotX=pivotX*drawScale,
		_pivotY=pivotY*drawScale,_width=width*drawScale,_height=height*drawScale;
		var translateX = _x+_pivotX,translateY = _y+_pivotY;
		//应用位移和旋转
		canvas.translate(translateX,translateY);
		canvas.rotate(this.rotate());
		canvas.translate(-translateX,-translateY);
		if(this.func!=null)
			this.func(canvas,this);
		if(this.drawBorder)
		{
			this.drawPhyBorder(canvas);
			this.drawSelfBorder(canvas);
		}
		//设置透明度
		canvas.globalAlpha = alpha;
		//设置混色
		canvas.globalCompositeOperation = blend;
		//缩放
		canvas.translate(translateX,translateY);
		canvas.scale(scaleW,scaleH);
		canvas.translate(-translateX,-translateY);
	}

	this.draw = function(canvas){}
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
			this.x(phyAttr.body.GetPosition().x-this.width()/2);
			this.y(phyAttr.body.GetPosition().y-this.height()/2);
			this.rotate(phyAttr.body.GetAngle());
		}
		canvas.save();
		this.preDraw(canvas);//调用基类的预处理
		if(image!=null)
		{
			if(imageCut.use)
				canvas.drawImage(image,imageCut.sx,imageCut.sy,imageCut.swidth,imageCut.sheight,
					this.x()*ANEngine.drawScale,
					this.y()*ANEngine.drawScale,
					this.width()*ANEngine.drawScale,
					this.height()*ANEngine.drawScale);
			else
				canvas.drawImage(image,
					this.x()*ANEngine.drawScale,
					this.y()*ANEngine.drawScale,
					this.width()*ANEngine.drawScale,
					this.height()*ANEngine.drawScale);
		}
		canvas.restore();
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
	this.physicalSkin = new ANEngine.physicalEngine.PhysicalSkin(this);

	this.setSpriteSheet = function(_image,data,_fps)
	{
		fps = fps||_fps;
		var i = 0;
		spriteSheetData = [];
		for(var index in data.frames)
		{
			var frame = {name:i,frameData:data.frames[index]};
			spriteSheetData.push(frame);
			i++;
		}
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
		_curFrame = num;
		isPlay = true;
	}

	this.gotoAndStop = function(num)
	{
		_curFrame = num;
		isPlay = false;
	}

	this.draw = function(canvas)
	{
		var phyAttr = this.physicalSkin.getPhyAttr();
		if(this.physicalSkin.EnabledPhy()&&phyAttr.body!=null)
		{
			this.x(phyAttr.body.GetPosition().x-this.width()/2);
			this.y(phyAttr.body.GetPosition().y-this.height()/2);
			this.rotate(phyAttr.body.GetAngle());
		}
		canvas.save();
		this.preDraw(canvas);//调用基类的预处理
		if(image!=null)
		{
			var curTime = new Date().getTime();
			var interval = curTime-lastFrameTime;
			var frame = spriteSheetData[_curFrame].frameData;
			canvas.drawImage(image,frame.frame.x,frame.frame.y,frame.frame.w,frame.frame.h,
					this.x()*ANEngine.drawScale,
					this.y()*ANEngine.drawScale,
					this.width()*ANEngine.drawScale,
					this.height()*ANEngine.drawScale);
			if(!fps||interval>=1000/fps)
			{
				lastFrameTime = curTime;
				if(isPlay)
				{
					_curFrame = ++_curFrame>=_totalFrame?0:_curFrame;
				}
			}
		}
		canvas.restore();
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
				_this.x(x);
				_this.y(y);
				_this.rotate(angle);
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
			var angle = _this.rotate();
			var x = _this.x(),y = _this.y(),width = _this.width(),height = _this.height();
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

//一个点击拖拽控制器，调用update更新
ANEngine.physicalEngine.BaseController = function(canvas,world)
{
	var mouseX, mouseY,mousePVec, isMouseDown, selectedBody, mouseJoint;
	var canvasPosition = getElementPosition(canvas);
	document.addEventListener("mousedown", function(e) {
        isMouseDown = true;
        handleMouseMove(e);
        document.addEventListener("mousemove", handleMouseMove, true);
    }, true);

    document.addEventListener("mouseup", function() {
        document.removeEventListener("mousemove", handleMouseMove, true);
        isMouseDown = false;
        mouseX = undefined;
        mouseY = undefined;
    }, true);

	function handleMouseMove(e) {
		var scrollTopLeft = getScrollTopLeft();
        var clientX = e.clientX + scrollTopLeft.Left;
        var clientY = e.clientY + scrollTopLeft.Top;
        mouseX = (clientX - canvasPosition.x) / 30;
        mouseY = (clientY - canvasPosition.y) / 30;
        //console.log(mouseX+","+mouseY);
    };

    function getElementPosition(element) {
        var elem=element, tagname="", x=0, y=0;
           
        while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
            y += elem.offsetTop;
            x += elem.offsetLeft;
            tagname = elem.tagName.toUpperCase();

            if(tagname == "BODY")
                elem=0;

            if(typeof(elem) == "object") {
                if(typeof(elem.offsetParent) == "object")
                    elem = elem.offsetParent;
               	}
        }
        
        return {x: x, y: y};
    }

    function getScrollTopLeft() 
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

    function getBodyAtMouse() {
        mousePVec = new ANEngine.physicalEngine.Box2d.b2Vec2(mouseX, mouseY);
        var aabb = new ANEngine.physicalEngine.Box2d.b2AABB();
        aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
        aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
            
        // Query the world for overlapping shapes.

        selectedBody = null;
        world.QueryAABB(getBodyCB, aabb);
        return selectedBody;
    }

    function getBodyCB(fixture) {
        if(fixture.GetBody().GetType() != ANEngine.physicalEngine.Box2d.b2Body.b2_staticBody) {
            if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec))
            {
                selectedBody = fixture.GetBody();
                return false;
            }
        }
        return true;
    }

    this.update = function() {
        if(isMouseDown && (!mouseJoint)) {
            var body = getBodyAtMouse();
            if(body) {
                var md = new ANEngine.physicalEngine.Box2d.b2MouseJointDef();
                md.bodyA = world.GetGroundBody();
                md.bodyB = body;
                md.target.Set(mouseX, mouseY);
                md.collideConnected = true;
                md.maxForce = 300.0 * body.GetMass();
                mouseJoint = world.CreateJoint(md);
                body.SetAwake(true);
            }
        }
            
        if(mouseJoint) {
            if(isMouseDown) {
                mouseJoint.SetTarget(new ANEngine.physicalEngine.Box2d.b2Vec2(mouseX, mouseY));
            } else {
                world.DestroyJoint(mouseJoint);
                mouseJoint = null;
            }
        }
    }
}
