import random,dateparser, datetime,os,json,csv,wikipediaapi
from shutil import copyfile

epoch = datetime.datetime.utcfromtimestamp(0)
wiki = wikipediaapi.Wikipedia('INTERalliance Wiki Races (tech@interalliance.org)', 'en')

levels = {}

cursor = "> "


def backup():
    source = os.path.join(os.pardir, "game/game_static/levels.json")
    destination = os.path.join(os.pardir, "game/game_static/BU_levels.json")
    copyfile(source, destination)


def set_json(raw_string: str):
    with open(os.path.join(os.pardir, "game/game_static/levels.json"), 'w') as file:
        return file.write(raw_string)


def get_time() -> str:
    time = dateparser.parse(input(cursor))
    while time == None:
        print("Invalid time.")
        time = dateparser.parse(input(cursor))
    return time.isoformat()


i = 0
def get_name() -> str:
    global i
    i += 1
    print(f"Now editing level {i}.")
    return f"level{i}"


def start_time() -> str:
    print("Enter the time the level should open. (e.g. 'in 3 min', 'Fri, 12 Dec 2023 10:55:50)'")
    return get_time()


def end_time() -> str:
    print("Enter the time the level should close. (e.g. 'in 10 min', 'Fri, 12 Dec 2023 10:59:00')")
    return get_time()

# This function accepts a new level from user input.
def new_page(point):
    proceed = True
    while proceed != False:
        # ask for start/end page
        if point == "start":
            print("Enter the part of the wikipedia url after 'https://en.wikipedia.org/wiki/' for the starting page.")
        else:
            print("Enter the part of the wikipedia url after 'https://en.wikipedia.org/wiki/' for the ending page.")
        
        print("Or, press enter to randomize from the list of levels.")
        # read result
        result = input(cursor)
        # randomly generate a result if not specify
        if result == "":
            result = fromList()
        # verify that page exists
        page = wiki.page(result)
        proceed = not page.exists()
    # confirm result
    print("The " + point + " of level " + str(i) + " will be " + result)
    return result

# This function reads from a file of known good levels, to allow for automatically generated level data.
def fromList():
    with open(os.path.join(os.pardir, "game/game_static/knowngood.csv"), 'r') as file: 
        for row in csv.reader(file):
            result = random.choice(row)
        return result

def generate_level():
    return {
        "name": get_name(),
        "startTime": "",
        "endTime": "",
        "startPage": new_page("start"),
        "endPage": new_page("end")
    }


def add_level():
    level = generate_level()
    levels[level["name"]] = level


def accept(prompt, repeat=True):
    print(prompt)
    choice = input("> ")
    choice = choice.lower()[0]
    if choice == "y":
        return True
    elif choice == "n":
        return False
    else:
        return accept("Please specify (y/n)")


while accept("Would you like to add another level?"):
    add_level()

saveMessage = "Would you like to save " + str(len(levels)) + " level(s)?"

if accept(saveMessage):
    print("Written and backed up")
    backup()
    set_json(json.dumps(levels, indent=4))
    print("Level start and end points were created.")
    print("You need to run setTime.py now.")
else:
    print("Cancelled - Nothing written")
