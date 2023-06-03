import xml.etree.ElementTree as ET

text = '<xml><ToUserName><![CDATA[gh_eaace1587006]]></ToUserName>\n<FromUserName><![CDATA[oFpeq6Nr0bMIRCzJ3gjzm3Z5TZpA]]></FromUserName>\n<CreateTime>1685043017</CreateTime>\n<MsgType><![CDATA[text]]></MsgType>\n<Content><![CDATA[Test]]></Content>\n<MsgId>24124019405235105</MsgId>\n</xml>'

root = ET.fromstring(text)

print(root.find("ToUserName").text)
print(ET.tostring(root))

