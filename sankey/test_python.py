import itertools
from itertools import groupby
from operator import itemgetter


a = ['decade','month','country','airplane_damage','phase','make','fatalities']
print list(itertools.combinations(a,2))

text = open('test_python.csv').read()

