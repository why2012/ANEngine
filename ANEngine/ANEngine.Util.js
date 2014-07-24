/*
	Author:WHY
	dependences:JQuery , Hammer
*/
ANEngine.Util = {};
ANEngine.Util.MovieClip = {};

ANEngine.Util.MovieClip.XmlToJson = function(xml)
{
	var json = {"frames":{}};
	$(xml).find("SubTexture").each(function(){
		json.frames[$(this).attr('name')] = {"frame":{"x":$(this).attr('x'),"y":$(this).attr('y'),
		"w":$(this).attr('width'),"h":$(this).attr('height')}};
	});

	return json;
}

//监控资源的加载进度
ANEngine.Util.LoadMonitor = function()
{
    var sources = {};
    this.onprogress = null;//进度更新回调,参数为已加载资源数和资源总数
    this.onload = null;//所有资源加载完毕后回调，参数为资源总数

    this.getLoadedSrcNum = function()
    {
        var num = 0;
        for(var i in sources)
        {
            if(sources[i].loaded)
                num++;
        }
        return num;
    }

    this.addImgSource = function(src,callback)
    {
        var img = new Image();
        img.src = src;
        var _this = this;
        var _sources = sources;
        img.onload = function()
        {
            callback(img);
            sources[src].loaded = true;
            if(_this.onprogress)
            {
                var sourcesLen = 0;
                for(var i in _sources)
                    sourcesLen++;
                var loadedNum = _this.getLoadedSrcNum();
                _this.onprogress(loadedNum,sourcesLen);
                if(loadedNum==sourcesLen&&_this.onload)
                {
                    _this.onload(sourcesLen);
                }
            }
        }
        sources[src] = {item:img,src:src,loaded:false};
    }

    this.addJsonSource = function(src,callback)
    {
        var _this = this;
        var _sources = sources;
        $.getJSON(src,function(json)
        {
            callback(json);
            sources[src].loaded = true;
            if(_this.onprogress)
            {
                var sourcesLen = 0;
                for(var i in _sources)
                    sourcesLen++;
                var loadedNum = _this.getLoadedSrcNum();
                _this.onprogress(loadedNum,sourcesLen);
                if(loadedNum==sourcesLen&&_this.onload)
                {
                    _this.onload(sourcesLen);
                }
            }
        });
        sources[src] = {item:null,src:src,loaded:false};
    }

    this.addOtherSource = function(src,params,callback,type)
    {
        var _this = this;
        var _sources = sources;
        $.get(src,params,function(s)
        {
            callback(s);
            sources[src].loaded = true;
            if(_this.onprogress)
            {
                var sourcesLen = 0;
                for(var i in _sources)
                    sourcesLen++;
                var loadedNum = _this.getLoadedSrcNum();
                _this.onprogress(loadedNum,sourcesLen);
                if(loadedNum==sourcesLen&&_this.onload)
                {
                    _this.onload(sourcesLen);
                }
            }
        },type);
        sources[src] = {item:null,src:src,loaded:false};
    }
}

//一个点击拖拽控制器，调用update更新
ANEngine.Util.BaseController = function(canvas,scene,_mobile)
{
	var factor = 30/ANEngine.drawScale;
	var mouseX, mouseY,mousePVec, isMouseDown, selectedBody, mouseJoint;
	var canvasPosition = getElementPosition(canvas);
	var world = scene.phyWorld;
    var camera = scene.getCamera();
	this.mobile = _mobile||false;
	var hammer = null;
	var lastPinchTime = 0,curPinchTime = 0,pinchFrequency = 10;

	$(document).bind("mousedown", function(e) {
       	isMouseDown = true;
       	handleMouseMove(e);
       	$(document).bind("mousemove", handleMouseMove);
    });

    $(document).bind("mouseup", function() {
       	$(document).unbind("mousemove", handleMouseMove);
       	isMouseDown = false;
       	mouseX = undefined;
       	mouseY = undefined;
    });

    //mobile touch event
    document.addEventListener("touchstart", function(e) {
       	isMouseDown = true;
       	handleMouseMove(e);
       	document.addEventListener("touchmove", handleMouseMove);
    });

    document.addEventListener("touchend", function() {
        document.removeEventListener("touchmove", handleMouseMove);
       	isMouseDown = false;
       	mouseX = undefined;
       	mouseY = undefined;
    });

    //pinch
    if(this.mobile)
    {
    	hammer = new Hammer(canvas);
    	hammer.get('pinch').set({ enable: true });
    	hammer.on("pinchmove",function(ev){
    		curPinchTime = new Date().getTime();
    		if(curPinchTime - lastPinchTime>=1000/pinchFrequency)
    		{
                if(camera&&camera.setFar)
                {
                    camera.setFar(camera.far/ev.scale);
                }
                else
                {
    			    ANEngine.drawScale *= ev.scale;
                }
    			lastPinchTime = curPinchTime;
    		}
    	});
    }

	function handleMouseMove(e) {
		if(e.targetTouches)
			e = e.targetTouches[0];
		factor = 30/ANEngine.drawScale;
		var scrollTopLeft = getScrollTopLeft();
        var clientX = e.clientX + scrollTopLeft.Left;
        var clientY = e.clientY + scrollTopLeft.Top;
        mouseX = factor*(clientX - canvasPosition.x-ANEngine.offsetX*ANEngine.drawScale) / 30;
        mouseY = factor*(clientY - canvasPosition.y-ANEngine.offsetY*ANEngine.drawScale) / 30;
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