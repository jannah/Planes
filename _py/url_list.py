import urllib2
import datetime
import sys
first_year = 1919
end_year = 1920
found = 0
if len(sys.argv)>0:
    first_year = sys.argv[1]
    end_year = sys.argv[2]
    print "starting from %s to %s"%(first_year, end_year)
StartDate= "01/01/%s"%first_year
EndDate = "01/01/%s"%end_year
Date = datetime.datetime.strptime(StartDate, "%m/%d/%Y")
EndDate =datetime.datetime.strptime(EndDate, "%m/%d/%Y")
#print Date
today =  datetime.datetime.now()
max_retry = 2
url_list = []
root="http://aviation-safety.net/database/record.php?id="
f = open("data/url_list-%s-%s.txt"%(first_year, end_year), "wb")
while Date< EndDate:
    next = 0
    counter = 0
    url = ""
    while next==0:
        try:
            url = "%s%s-%s"%(root,Date.strftime("%Y%m%d"), counter)
            urllib2.urlopen(url)
            f.write("%s\n"%url)
            print url
            url_list.append(url)
            counter+=1
            found+=1
        except urllib2.HTTPError, e:
#            print"HTTP: %s\t%s"%(e.code, url)
            next = 1
        except urllib2.URLError, e:
            print"URL %s\t%s"%(e.args, url)
            
#            print(e.args)
    Date+=datetime.timedelta(days=1)


print "%s-%s\ttotal found=%s"%(first_year, end_year, found)
#for u in range(0, len(url_list)):
#    f.write("%s\n"%url_list[u])