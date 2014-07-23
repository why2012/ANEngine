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
//粒子系统
ANEngine.Particle = {};

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
		this.whFactor = width/height;
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
			curTime = new Date().getTime()
			width = _canvas.width
			height = _canvas.height;
			this.whFactor = width/height;
			canvas.clearRect(0,0,width,height);
			if(backgroud!=null)
				canvas.drawImage(backgroud,0,0,width,height);
			for(var index in layers)
			{
				layers[index].drawLayer(canvas);
			}
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
	this.x = _x;
	this.y = _y;
	this.pivotX = _width/2;//旋转轴心
	this.pivotY = _height/2;
	var width = _width;
	var height = _height;
	this.rotate = _rotate==undefined?0:_rotate;//旋转弧度
	this.alpha = 1;
	this.blend = "source_over";
	this.scaleW=1;
	this.scaleH=1;
	this.func = null;
	this.layer = null;
	this.drawBorder = false;//是否画边框，物理边框为红色，sprite边框为蓝色

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
		pivotY=this.pivotY*drawScale,width=this.width*drawScale,height=this.height*drawScale;
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
		canvas.lineTo(sprite.width()*drawScale+sprite.x*drawScale,sprite.y*drawScale);
		canvas.lineTo(sprite.width()*drawScale+sprite.x*drawScale,sprite.height()*drawScale+sprite.y*drawScale);
		canvas.lineTo(sprite.x*drawScale,sprite.height()*drawScale+sprite.y*drawScale);
		canvas.lineTo(sprite.x*drawScale,sprite.y*drawScale);
		canvas.closePath();
		canvas.stroke();
		canvas.restore();	
	}

	this.preDraw = function(canvas)
	{
		var drawScale = ANEngine.drawScale;
		//计算像素单位
		var _x=this.x*drawScale,_y=this.y*drawScale,_pivotX=this.pivotX*drawScale,
		_pivotY=this.pivotY*drawScale,_width=width*drawScale,_height=height*drawScale;
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
		var co = new this.constructor(_x,_y,_width,_height,_rotate);
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
			this.x = phyAttr.body.GetPosition().x-this.width()/2;
			this.y = phyAttr.body.GetPosition().y-this.height()/2;
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
					this.width()*ANEngine.drawScale,
					this.height()*ANEngine.drawScale);
			else
				canvas.drawImage(image,
					this.x*ANEngine.drawScale,
					this.y*ANEngine.drawScale,
					this.width()*ANEngine.drawScale,
					this.height()*ANEngine.drawScale);
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
	this.physicalSkin = new ANEngine.physicalEngine.PhysicalSkin(this);

	this.setSpriteSheet = function(_image,_data,_fps)
	{
		fps = fps||_fps;
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
			this.x = phyAttr.body.GetPosition().x-this.width()/2;
			this.y = phyAttr.body.GetPosition().y-this.height()/2;
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

	this.Clone = function()
	{
		var co = this.DisplayObject_Clone();
		co.setSpriteSheet(image,data,fps);
		//co.physicalSkin = physicalSkin.Clone();
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
    this.PUBLIC_R_VALUE = 0
    this.PUBLIC_G_VALUE = 0
    this.PUBLIC_B_VALUE = 0;
 
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
        /*this.quad.r+=this.PUBLIC_R_VALUE;
        this.quad.g+=this.PUBLIC_G_VALUE;
        this.quad.b+=this.PUBLIC_B_VALUE;
        this.quad.a+=this.PUBLIC_A_VALUE;*/
 
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
        /*this.quad.r=1
        this.quad.g=1
        this.quad.b=1
        this.quad.a=1*/
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
			if (!this.list[i].PUBLIC_START)
            {
                //填充粒子属性
                var particle = particle[i];
                particle.show();
				var o = particle.dObject;
				o.x = launcher.PUBLIC_X + Math.random() * launcher.PUBLIC_SCOPE_X - launcher.PUBLIC_SCOPE_X / 2;
				o.y = launcher.PUBLIC_Y + Math.random() * launcher.PUBLIC_SCOPE_Y - launcher.PUBLIC_SCOPE_Y / 2;

                particle.PUBLIC_A_VALUE = this.launcher.PUBLIC_A_VALUE;
                particle.PUBLIC_R_VALUE = this.launcher.PUBLIC_R_VALUE;
                particle.PUBLIC_G_VALUE = this.launcher.PUBLIC_G_VALUE;
                particle.PUBLIC_B_VALUE = this.launcher.PUBLIC_B_VALUE;
 
                particle.PUBLIC_ANGLE_VALUE = this.launcher.PUBLIC_ANGLE_VALUE;
                particle.PUBLIC_ALPHA_VALUE = this.launcher.PUBLIC_ALPHA_VALUE;
                particle.PUBLIC_SCALEX_VALUE = this.launcher.PUBLIC_SCALEX_VALUE;
                particle.PUBLIC_SCALEY_VALUE = this.launcher.PUBLIC_SCALEY_VALUE;
 
                /*o.a=this.launcher.PUBLIC_A;
                o.r=this.launcher.PUBLIC_R;
                o.g=this.launcher.PUBLIC_G;
                o.b=this.launcher.PUBLIC_B;*/
 
                o.rotate = this.launcher.PUBLIC_ROTATION_VAlUE;
 
                particle.PUBLIC_ROTATION_VALUE = this.launcher.PUBLIC_ROTATION_VAlUE + Math.random() * this.launcher.PUBLIC_ROTATION_RANDOM;
                particle.PUBLIC_SPEED_VALUE = this.launcher.PUBLIC_SPEED_VALUE;
                break;
            }
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
 
    //粒子初始化颜色参数
    this.PUBLIC_A_VALUE = 0;
    this.PUBLIC_R_VALUE = 0;
    this.PUBLIC_G_VALUE = 0;
    this.PUBLIC_B_VALUE = 0;
 
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
    this.PUBLIC_R = 1
    this.PUBLIC_G = 1
    this.PUBLIC_B = 1
    this.PUBLIC_A = 1
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
			var x = _this.x,y = _this.y,width = _this.width(),height = _this.height();
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
