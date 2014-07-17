/**
	Auhtor:WHY
	Description:a simple 2d engine binded with box2d
*/
var ANEngine = function()
{

}

ANEngine.drawScale = 30;
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
	scene.drawScene();
}

ANEngine.Scene = function(_canvas)
{
		var width = _canvas.width;
		var height = _canvas.height;
		var canvas = _canvas.getContext("2d");
		var layers = new Array();
		this.phyWorld = ANEngine.physicalEngine.createWorld(ANEngine.physicalEngine.gravity.x,ANEngine.physicalEngine.gravity.y);

		//添加图层
		this.addLayer = function(layer)
		{
			layer.setPhyWorld(this.phyWorld);
			layers.push(layer);
		}

		//场景绘制
		this.drawScene = function()
		{
			canvas.clearRect(0,0,width,height);
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

ANEngine.Sprite = function(_x,_y,_width,_height,_rotate)
{
		var image = null;//贴图,加载完后调用setChartlet()设置
		var imageCut = {use:false,sx:0,sy:0,swidth:0,sheight:0};
		var x = _x;
		var y = _y;
		var pivotX = _width/2;//旋转轴心
		var pivotY = _height/2;
		var width = _width;
		var height = _height;
		var rotate = _rotate==undefined?0:_rotate;//旋转弧度
		var func = null;//canvas绘图回调
		var enabledPhy = false;
		this.drawBorder = false;//是否画边框，物理边框为红色，sprite边框为蓝色
		this.layer = null;

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

		//在layer被添加进场景后此函数才有效
		this.addToPhyWorld = function()
		{
			if(this.layer!=null)
			{
				this.layer.addAnimItemPhy(this);
				enabledPhy = true;
			}
		}

		//在layer被添加进场景后此函数才有效
		this.updatePhy = function()
		{
			if(this.layer!=null)
			{
				this.layer.updateAnimItemPhy(this);
				enabledPhy = true;
			}
		}

		//在layer被添加进场景后此函数才有效
		this.destroyPhy = function()
		{
			if(this.layer!=null)
			{
				this.layer.destroyAnimItemPhy(this);
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

		this.setChartlet = function(_image,scut)
		{
			image = _image;
			if(scut)
				scut.use = true;
			imageCut = scut||imageCut;
		}

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

		this.drawInCanvas = function(_func)
		{
			func = _func;
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
			var body = sprite.getPhyAttr().body;
			if(sprite.getPhyAttr().shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Box)
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
			else if(sprite.getPhyAttr().shape==ANEngine.physicalEngine.PhysicsAttr.Shape.Circle)
			{
				radius = body.GetFixtureList().GetShape().m_radius;
				var center = Box2D.Common.Math.b2Math.MulX(body.m_xf,body.GetFixtureList().GetShape().m_p);
				sprite.canvasDrawCircle(canvas,radius,center);
			}
			canvas.restore();
		}

		//蓝色
		this.drawSpriteBorder = function(canvas,_sprite)
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

		this.draw = function(canvas)
		{
			if(enabledPhy&&phyAttr.body!=null)
			{
				this.x(phyAttr.body.GetPosition().x-this.width()/2);
				this.y(phyAttr.body.GetPosition().y-this.height()/2);
				this.rotate(phyAttr.body.GetAngle());
			}
			canvas.save();
			var drawScale = ANEngine.drawScale;
			var x=this.x()*drawScale,y=this.y()*drawScale,pivotX=this.pivotX()*drawScale,
			pivotY=this.pivotY()*drawScale,width=this.width()*drawScale,height=this.height()*drawScale;
			var translateX = x+pivotX,translateY = y+pivotY;
			//应用位移和旋转
			canvas.translate(translateX,translateY);
			canvas.rotate(rotate);
			canvas.translate(-translateX,-translateY);
			if(func!=null)
				func(canvas,this);
			if(this.drawBorder)
			{
				this.drawPhyBorder(canvas);
				this.drawSpriteBorder(canvas);
			}
			if(image!=null)
			{
				if(imageCut.use)
					canvas.drawImage(image,imageCut.sx,imageCut.sy,imageCut.swidth,imageCut.sheight,x,y,width,height);
				else
					canvas.drawImage(image,x,y,width,height);
			}
			canvas.restore();
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
			var angle = rotate;

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
					radius = Math.sqrt(width*width+height*height)/2
				}
				else if(phyAttr.circleAlign==ANEngine.physicalEngine.PhysicsAttr.CircleAlign.OUT)
				{
					radius = width<height?width/2:height/2;
				}

				phyAttr.fixture.shape = new Box2d.b2CircleShape(radius);
			}
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
};

ANEngine.physicalEngine.PhysicsAttr = {
	Type:{Static:ANEngine.physicalEngine.Box2d.b2Body.b2_staticBody,Dynamic:ANEngine.physicalEngine.Box2d.b2Body.b2_dynamicBody},
	Shape:{Box:"Box",Circle:"Circle"},
	CircleAlign:{IN:"IN",OUT:"OUT"},
};

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
