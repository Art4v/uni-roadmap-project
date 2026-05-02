# imports
from bs4 import BeautifulSoup
import requests

# parsing
page_to_scrape = requests.get("http://quotes.toscrape.com") # request target website and store as variable
soup = BeautifulSoup(page_to_scrape.text, "html.parser") # parse the website as html and store as a variable

# scrape the quotes and the quote author
quotes = soup.find_all("span", attrs={"class": "text"}) # get all the quotes and save as a list
authors = soup.find_all("small", attrs={"class": "author"}) # get all the authors and save as a list

# print out quotes and authors
for quote, author in zip(quotes, authors):
    print(quote.text + ' - ' +  author.text)
