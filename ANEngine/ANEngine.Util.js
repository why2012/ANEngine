/*
	Author:WHY
	dependences:JQuery
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