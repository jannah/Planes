__author__="Jannah"
__date__ ="$Apr 28, 2014 9:48:30 PM$"

from setuptools import setup,find_packages

setup (
  name = 'planes',
  version = '0.1',
  packages = find_packages(),

  # Declare your packages' dependencies here, for eg:
  install_requires=['foo>=3'],

  # Fill in these to make your Egg ready for upload to
  # PyPI
  author = 'Jannah',
  author_email = '',

  summary = 'Just another Python package for the cheese shop',
  url = '',
  license = '',
  long_description= 'Long description of the package',

  # could also include long_description, download_url, classifiers, etc.

  
)