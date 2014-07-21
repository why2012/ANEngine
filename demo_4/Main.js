//需要加载的图像资源
var imageAddress=["bg.jpg","eff.png"];

//需要加载的XML对象池
var xmlAddress=["eff.xml"];

//已经加载好的图像资源池
var imageStart=[];

//XML已经加载好的对象池
var xmlStart=[];

//当前加载资源的ID
var imageId=0;

//XML加载ID
var xmlid=0;

//加载回调函数
this.loadImag=function()
{
    var imageObj=new Image();
    imageObj.src=imageAddress[imageId];
    imageObj.onload=function(){
        if(imageObj.complete==true){
            imageStart.push(imageObj);
            imageId++;
            if(imageId<imageAddress.length)
            {
                loadImag();
            }
            if(imageId==imageAddress.length)
            {
                loadXml();
            }

        }
    }
}

this.loadXml=function()
{
    var load=new AnimationXML();
    this.initer=function(e)
    {
        xmlStart.push(load);
        xmlid++;

        if(xmlid<xmlAddress.length)
        {
            loadXml();
        }
        if(xmlid==xmlAddress.length)
        {
            init();
        }
    }
    load.addEventListener(this.initer);
    load.createURL(xmlAddress[xmlid]);
}

window.onload=function(){
    this.loadImag();
}

//定义场景管理器
var stage2d;

//初始化函数
function init () {

    //创建场景管理器
	stage2d=new Stage2D();

    //启用场景逻辑
	stage2d.init();

    var mc=new MovieClip2D(imageStart[0]);
    mc.isPlay=1;
    mc.x=1024/2;
    mc.y=768/2;
    mc.frameWidth=imageStart[0].width;
    mc.frameHeight=imageStart[0].height;
    stage2d.addChild(mc);

    var mc2=new MovieClip2D(imageStart[1],xmlStart[0].quadDataList);
    mc2.isPlay=2;
    mc2.x=1024/2;
    mc2.y=768/2;
    mc2.scene("eff_5")
    //设置混色样式为叠加
    mc2.blend="lighter";
    stage2d.addChild(mc2);
}









