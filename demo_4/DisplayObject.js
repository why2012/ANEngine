//画布
var canvas;
//上下文
var context;

//场景宽度
var stageWidth=1024;

//场景高度
var stageHeight=768;

//显示列表
var displayObjectList = new Array();

//创建画布上下文
$(document).ready(function(){
    canvas=$("#myCanvas");
    context=canvas.get(0).getContext("2d");
});

this.AnimationXML=function()
{
    this.quadFrameList;
    this.quadDataList;
    this.loadComplete =null;
    loadTarget=this;
    this.createXMLHttpRequest=function(){
        if (window.ActiveXObject){
            xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
        }else if (window.XMLHttpRequest){
            xmlHttp = new XMLHttpRequest("Msxml2.XMLHTTP.3.0");
        };
    };

    //发请请求
    this.doSearch=function(url){
        this.createXMLHttpRequest();
        xmlHttp.onreadystatechange = this.handleStateChange;
        xmlHttp.open("GET",url,"true");
        xmlHttp.send(null);
    };

    //处理响应
    this.handleStateChange=function(){
        if (xmlHttp.readyState == 4){
            if (xmlHttp.status == 200){
                loadTarget.parseResults();
            };
        };
    };

    //取得URL
    this.createURL=function(text){
        this.doSearch(text);
    };

    //读取XML文件
    this.addEventListener=function(fun)
    {
        this.loadComplete = fun;
    };
    /**
     * 删除侦听器
     * @param	event
     */
    this.removeEventListener=function(event)
    {
        switch(event)
        {
            case EVENT_COMPLETE:
                this.loadComplete = null;
                break;
        };
    };
    this.parseResults=function(){
        var results = xmlHttp.responseXML;
        var textureAtlas = results.getElementsByTagName("SubTexture");
        this.quadDataList=[];
        this.quadFrameList=[];

        for (var i = 0; i< textureAtlas.length; i++){
            subTexture =  textureAtlas[i];
            if(name!=subTexture.getAttribute("name").substr(0,subTexture.getAttribute("name").length-4))
            {

                this.quadFrameList=[];
                var quadData=new QuadData();
                quadData.name=subTexture.getAttribute("name").substr(0,subTexture.getAttribute("name").length-4);
                quadData.quadFrameLst=this.quadFrameList;
                this.quadDataList.push(quadData);
            };



            var cacheframeWidth;
            var cacheframeHeight;
            var cacheWidth;
            var cacheHeight
            var quadFrame=new QuadFrame();
            quadFrame.name=subTexture.getAttribute("name");
            var replace=subTexture.getAttribute("x");
            if(replace!=null)
            {
                quadFrame.x=replace;
            };

            replace=subTexture.getAttribute("y");
            if(replace!=null)
            {
                quadFrame.y=replace;
            };

            replace=subTexture.getAttribute("width");
            if(replace!=null)
            {
                quadFrame.width=replace;
                cacheWidth=replace;
            };

            replace=subTexture.getAttribute("height");
            if(replace!=null)
            {
                quadFrame.height=replace;
                cacheHeight=replace;
            };

            replace=subTexture.getAttribute("frameX");
            if(replace!=null)
            {
                quadFrame.frameX=subTexture.getAttribute("frameX");
            }else
            {
                quadFrame.frameX=0;
            }

            replace=subTexture.getAttribute("frameY");
            if(replace!=null)
            {
                quadFrame.frameY=replace;
            }else
            {
                quadFrame.frameY=0;
            }

            replace=subTexture.getAttribute("frameWidth");
            if(replace!=null)
            {
                quadFrame.frameWidth=replace;
                cacheframeWidth=replace;
            }else{

                if(cacheframeWidth!=null)
                {
                    quadFrame.frameWidth=cacheframeWidth;
                }else
                {
                    quadFrame.frameWidth=cacheWidth;
                }
            }

            replace=subTexture.getAttribute("frameHeight");
            if(replace!=null)
            {
                quadFrame.frameHeight=replace;
                cacheframeHeight=replace;
            }else
            {
                if(cacheframeHeight!=null)
                {
                    quadFrame.frameHeight=cacheframeHeight;
                }else
                {
                    quadFrame.frameHeight=cacheHeight;
                }

            }

            this.quadFrameList.push(quadFrame);
            name=subTexture.getAttribute("name").substr(0,subTexture.getAttribute("name").length-4);
        }


        if(this.loadComplete!=null){
            this.loadComplete(this);
        };
    };
};

//帧信息
function QuadData()
{
    /**
     * 场景名称
     */
    this.name="";

    /**
     * 帧片段
     */
    this.quadFrameLst;
};


//帧缓存
function QuadFrame()
{
    /**
     * 帧名称
     */
    this.name="";

    /**
     * 帧X坐标
     */
    this.x = 0;

    /**
     * 帧Y坐标
     */
    this.y = 0;

    /**
     * 帧宽度
     */
    this.width = 0;

    /**
     * 帧高度
     */
    this.height = 0;

    /**
     * 帧X偏移坐标
     */
    this.frameX = 0;

    /**
     * 帧Y偏移坐标
     */
    this.frameY = 0;

    /**
     * 帧最大宽度
     */
    this.frameWidth = 0;

    /**
     * 帧最大高度
     */
    this.frameHeight = 0;
};

//查询显示对象是否在数组中
function indexOf(Object)
{
	for(var i = 0;i<displayObjectList.length;i++){  
        if(displayObjectList[i] == Object){  
           return i;  
         }  
    }  
    return -1;  
}

//重绘核心
function paint()
{
    //清理画面
	context.clearRect(0,0,stageWidth,stageHeight);

    //重置画布的透明度
    context.globalAlpha=1;

    //循环遍历显示对象
	for(var i=0;i<displayObjectList.length;i++)
	{
        //调用显示对象的paint重绘方法
		displayObjectList[i].paint();
	}

    //设置计时器延迟为0
	setTimeout(paint,0);
}

//场景管理器
function Stage2D()
{
	//初始化启动计时器
	this.init=function()
	{
        setTimeout(paint,0);
	}
	
	//添加子对象
	this.addChild=function(child)
	{
		if(indexOf(child)==-1)
		{
			displayObjectList.push(child);
		}else
		{
            displayObjectList.splice(child,1);
            displayObjectList.push(child);
		}
	}
	
	//删除子对象
	this.removeChild=function(child)
	{
		if(indexOf(child)!=-1)
		{
			displayObjectList.splice(child,1);
		}
	}
}

//动画类
function MovieClip2D(img,data)
{
    //动画类的X坐标
	this.x=0;

    //动画类的Y坐标
	this.y=0;

    //动画类的角度
	this.rotation=0;

    //动画类的X轴比例
	this.scaleX=1;

    //动画类的Y比例
	this.scaleY=1;

    //动画类的可见性
	this.visible=true;

    //动画播放速度
    this.animationSpeed=24;

    //用于计算过去的时间
    this.animationTime=0;

    //动画类的透明度
	this.alpha=1;

    //动画实际宽度
    this.width=0;

    //动画实际高度
    this.height=0;

    //帧偏移X信息
    this.frameX=0;

    //帧偏移Y信息
    this.frameY=0;

    //动画ID
    this.nameId=0;

    //动画相对于原始图像的裁切X位置
    this.mcX=0;

    //动画相对于原始图像的裁切Y位置
    this.mcY=0;

    //动画对象的宽度
    this.frameWidth=32;

    //动画对象的高度
    this.frameHeight=32;

    //当前动画场景帧的总长度
    this.totalFrames=1;

    //当前动画播放的帧编号
    this.currentFrame=0;

    //动画播放头X位置
    this.frameHeadX=0;

    //动画播放头Y位置
    this.frameHeadY=0;

    //是否播放动画
    this.isPlay=0;

    //逻辑更新开关
    this.logicUpData=true;

    //混色参数
    this.blend="source-over";

    //跳转到某一帧并且播放
    this.gotoAndPlay=function(value)
    {
        this.currentFrame=value;
        this.logicUpData=true;
    }

    //跳转到某一帧并且停止
    this.gotoAndStop=function(value)
    {
        this.currentFrame=value;
        this.logicUpData=false;
    }

    //开始播放动画
    this.play=function()
    {
        this.logicUpData=true;
    }

    //停止播放动画
    this.stop=function()
    {
        this.logicUpData=false;
    }

    //查询名字
    this.queryName=function(name)
    {
        for(var i=0;i<data.length;i++)
        {
            if(data[i].name==name)
            {
                return i;
            };
        };
        return 0;
    };

    /**
     设置场景,可以是数字或者名称
     **/
    this.scene=function(name)
    {
        if(isNaN(name))
        {
            this.nameId=this.queryName(name);
        }else
        {
            this.nameId=name;
        };
    };

    //动画更新逻辑
    this.upFrameData=function()
    {
        switch(this.isPlay)
        {
            case 1:
                this.mcY=this.frameHeadY*this.frameHeight;
                this.mcX=this.frameHeadX*this.frameWidth+this.currentFrame*this.frameWidth;

                break;
            case 2:
                this.width=data[this.nameId].quadFrameLst[this.currentFrame].width;
                this.height=data[this.nameId].quadFrameLst[this.currentFrame].height

                this.mcX=data[this.nameId].quadFrameLst[this.currentFrame].x;
                this.mcY=data[this.nameId].quadFrameLst[this.currentFrame].y;
                this.frameX=data[this.nameId].quadFrameLst[this.currentFrame].frameX;
                this.frameY=data[this.nameId].quadFrameLst[this.currentFrame].frameY;
                this.frameWidth=data[this.nameId].quadFrameLst[this.currentFrame].frameWidth;
                this.frameHeight=data[this.nameId].quadFrameLst[this.currentFrame].frameHeight;
                this.totalFrames=data[this.nameId].quadFrameLst.length;

                break;
        }
        if(this.logicUpData)
        {
            var date=new Date();
            if((date.getTime()-this.animationTime>=1000/this.animationSpeed))
            {
                this.animationTime=date.getTime();
                this.currentFrame++;
            }
            if(this.currentFrame>=this.totalFrames)
            {
                this.currentFrame=0;
            }
        }
    }

    //动画类的重绘函数
	this.paint=function()
	{
		if(this.visible)
		{

            this.upFrameData();
            //保存画布句柄状态
			context.save();

            //设置画布句柄的位置,实际上是设置的图像的位置
			context.translate(this.x,this.y);

            //设置画布旋转角度实际上是设置了图像的角度,参数是弧度,所以我们必须把角度转换为弧度
			context.rotate(this.rotation*Math.PI/180);

            //设置画布句柄的比例,实际上是设置了图像的比例
			context.scale(this.scaleX,this.scaleY);

            //更改画布句柄的透明度,从这以后绘制的图像都会依据这个透明度
            context.globalAlpha=this.alpha;
            
            //加入混色功能
            context.globalCompositeOperation=this.blend;

            switch(this.isPlay)
            {
                case 1:
                    context.drawImage(img,this.mcX,this.mcY,this.frameWidth,this.frameHeight,-this.frameWidth/2,-this.frameHeight/2,this.frameWidth,this.frameHeight);
                    break;
                case 2:
                    //增加了帧信息的偏移量,和最后一段的动画实际宽度和高度
                    context.drawImage(img,this.mcX,this.mcY,this.width,this.height,
                        -(this.frameX)-this.frameWidth/2,
                        -(this.frameY)-this.frameHeight/2
                        ,this.width,this.height);
                    break
                default :
                    context.drawImage(img,this.mcX,this.mcY,this.frameWidth,this.frameHeight,-this.frameWidth/2,-this.frameHeight/2,this.frameWidth,this.frameHeight);
                    break;
            }


            //最后返回画布句柄的状态,因为画布句柄是唯一的,它的状态也是唯一的,当我们使用之后方便其他地方使用所以
            //需要返回上一次保存的状态,就好像什么事情都没有发生过
			context.restore();
		}
	}
}


