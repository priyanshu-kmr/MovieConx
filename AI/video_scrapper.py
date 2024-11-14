import os

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Selenium Manager finds (or downloads) a matching ChromeDriver on any OS.
# Set CHROMEDRIVER_PATH only to force a specific driver binary.
CHROMEDRIVER_PATH = os.environ.get('CHROMEDRIVER_PATH')

def fix_imdb_ids(movie_id):
    if len(movie_id) < 7:
        fixed_id = movie_id.zfill(7)
    else:
        fixed_id = movie_id

    fixed_id = f"tt{fixed_id}"
    return fixed_id

def get_video(imdbId):
    options = Options()
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    service = Service(CHROMEDRIVER_PATH) if CHROMEDRIVER_PATH else Service()
    driver = webdriver.Chrome(service=service, options=options)

    try:
        fixed_id = fix_imdb_ids(imdbId)
        imdb_url = f"https://www.imdb.com/title/{fixed_id}/videogallery/"
        driver.get(imdb_url)
        wait = WebDriverWait(driver, 20)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div.ipc-slate-card:nth-child(1) > div:nth-child(1) > a:nth-child(2) > div:nth-child(2)')))
        elements = driver.find_elements(By.CSS_SELECTOR, 'div.ipc-slate-card')

        vid_link = None
        for i in range(1, len(elements) + 1):
            vid_type_element = driver.find_element(By.CSS_SELECTOR, f'div.ipc-slate-card:nth-child({i}) > div:nth-child(1) > a:nth-child(2) > div:nth-child(3) > span:nth-child(2)')
            vid_type = vid_type_element.text
            if 'trailer' in vid_type.lower():
                element = driver.find_element(By.CSS_SELECTOR, f'div.ipc-slate-card:nth-child({i}) > div:nth-child(1) > a:nth-child(2)')
                vid_link = element.get_attribute('href')
                break

        if not vid_link:
            raise LookupError(f"No trailer found for {fixed_id}")

        driver.get(vid_link)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.jw-video')))
        time.sleep(5)  # Add delay to ensure the video source is loaded
        vid_element = driver.find_element(By.CSS_SELECTOR, '.jw-video')
        return vid_element.get_attribute('src')
    finally:
        driver.quit()
