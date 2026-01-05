import requests
from bs4 import BeautifulSoup

def print_grid_from_google_doc(url):
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')
    rows = soup.find('table').find_all('tr')[1:]
    grid = {}
    for row in rows:
        c = [td.get_text(strip=True) for td in row.find_all('td')]
        if len(c) >= 3:
            try:
                grid[(int(c[0]), int(c[2]))] = c[1]
            except ValueError:
                pass
    if grid:
        max_x, max_y = max(k[0] for k in grid), max(k[1] for k in grid)
        for y in range(max_y, -1, -1):
            print(''.join(grid.get((x, y), ' ') for x in range(max_x + 1)))

