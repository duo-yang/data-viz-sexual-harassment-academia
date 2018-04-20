import requests
import json
from bs4 import BeautifulSoup
URL = "http://www.psychpage.com/learning/library/assess/feelings.html"

page = requests.get(URL)
soup = BeautifulSoup(page.content, 'html.parser')
tds = soup.find_all('td')
results = []
for td in tds:
	word = td.find('div')
	try:
		# print(word.text.lower())
		results.append(word.text.lower())
	except:
		# print('none')
		continue
new = []
for word in results:
	if word != '\xa0':
		new.append(word)
print(new)