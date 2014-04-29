import json
import urllib

f = open("output3.json","w")
api_url="9v9mpsz6"
count = 0
stop=0
data  = []
while stop==0:
	results = json.load(urllib.urlopen("http://www.kimonolabs.com/api/%s?apikey=bf1c6b92c46d2ecda3333b29f1c222d2&kimoffset=%s"%(api_url,count*2500)))
	count+=1
	print count
	if(len(results["results"]["data"]))==0:
		stop =1
	else:
		data.extend(results["results"]["data"])
f.write(json.dumps(data)

)