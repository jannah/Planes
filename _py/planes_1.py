# To change this license header, choose License Headers in Project Properties.
# To change this template file, choose Tools | Templates
# and open the template in the editor.

__author__="Jannah"
__date__ ="$Apr 26, 2014 12:40:29 AM$"
import json
import io
from dateutil.parser import *
from collections import Counter
filename="table_output.json"
data = []
newdata =[]
keys=Counter()
with io.open(filename) as f:
    for line in f:
        data =json.loads(line)
print len(data)
count =0
#output_filename = "table_output.json"
out = open("ground_fatalities.csv",'wb')
for i in range(0,len(data)):
    item = data[i]
    if item.get("Ground casualties"):
        val = "%s,%s,%s,%s"%(i,item["Date2"],item["C/n / msn"],",".join(item["Ground casualties"].split(':')))
        print val
        out.write("%s\n"%val)
        count+=1
print "Found %s"%count