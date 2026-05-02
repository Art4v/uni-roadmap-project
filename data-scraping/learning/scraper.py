# imports
from bs4 import BeautifulSoup
import json
import requests
import os

# parsing
page_to_scrape = requests.get("http://quotes.toscrape.com") # request target website and store as variable
soup = BeautifulSoup(page_to_scrape.text, "html.parser") # parse the website as html and store as a variable

# scrape the quotes and the quote author
quotes = soup.find_all("span", attrs={"class": "text"}) # get all the quotes and save as a list
authors = soup.find_all("small", attrs={"class": "author"}) # get all the authors and save as a list

# save to JSON file
data = [{"quote": quote.text, "author": author.text} for quote, author in zip(quotes, authors)]

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, "data.json")

with open(json_path, "w", encoding="utf-8") as jsonfile:
    json.dump(data, jsonfile, indent=2, ensure_ascii=False)

print(f"Data saved to {json_path}")
