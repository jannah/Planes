# To change this license header, choose License Headers in Project Properties.
# To change this template file, choose Tools | Templates
# and open the template in the editor.

__author__="Jannah"
__date__ ="$Apr 26, 2014 12:40:29 AM$"
import json
import io
from dateutil.parser import *
from collections import Counter
filename="output3.json"
data = []
newdata =[]
keys=Counter()
with io.open(filename) as f:
    for line in f:
        data =json.loads(line)
print len(data)
output_filename = "table_output.json"
for item in data:
    table = item['table']['text']
    table = table.encode('utf-8', 'ignore')
    text = table.split("\n")
    temp = {}
    for t in text:
        pair = t.split(":")
        key = pair[0]
        keys[key]+=1
        value= ":".join(pair[-len(pair)+1:]).strip()
#        print len(pair)
        temp[key]=value
        if key =="Date":
            keys["Date2"]+=1
            if value=="date unk." or value=="date unk":
                temp["Date2"]=""
            else:
                try:

                    newdate = parse(value)
                    date_str = newdate.strftime("%m/%d/%Y")
        #            print date_str
                    temp["Date2"]=date_str
                except Exception as inst2:
                    print "error with date: %s"% value
                    value = value.replace('xxx','JAN')
                    value = value.replace('XXX','JAN')
                    value = value.replace('xx','01')
                    value = value.replace('XX','01')
                    value = value.replace('x','0')
                    value = value.replace('X','0')
                    value = value.replace('99 ','01 ')
                    try:
                        newdate = parse(value)
                        date_str = newdate.strftime("%m/%d/%Y")
        #            print date_str
                        temp["Date2"]=date_str
                    except Exception as inst:
                        temp["Date2"]=""
                        print value
                        print type(inst)     # the exception instance
                        print inst.args      # arguments stored in .args
                        print inst
        if key =="Passengers" or key=="Crew" or key == "Total" :
            values = value.split("/")
            for v in values:
                pairs2 = v.split(":")
#                print pairs2[1]
                pairs2[1] = pairs2[1].strip()
                v2 = 0
                if len(pairs2[1])>0:
                    v2 = int(pairs2[1])
                temp_key="%s_%s" %(key,pairs2[0])
                temp[temp_key]= v2
                keys[temp_key]+=1
    try:        
        temp["Narrative"]=item['narrative'].encode('utf-8', 'ignore')
        keys["Narrative"]+=1
    except Exception as inst:
        val = ""
        for nar in  item['narrative']:
            val+="%s:%s;"%(nar,item['narrative'][nar])
        print val.encode('utf-8', 'ignore')
        temp["Narrative"]=val
    newdata.append(temp)
#    print temp
#    print text
#    print table
#    narrative
#print newdata
print keys
f = open(output_filename, "w")
f.write(json.dumps(newdata))
headers = {}
counter = 0
for key in keys:
    print key
    headers[key]=counter
    counter+=1
print headers
csvout = []

for d in newdata:
    item = [None]*counter
#    print d
    for key in d:
        value = d[key]
#        print "%s,%s"%(key,value)
        try:
            item[headers[key]]=str(value).encode('utf-8', 'ignore')
        except Exception as inst:
            value = value.decode('utf-8', 'ignore')
            item[headers[key]]= value.encode('utf-8','ignore')
    out = ",".join(item)
    print out
        
    