#ifndef FIELD_H
#define FIELD_H

#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <utility>
#include "json.hpp"

enum HEX_TYPE {ROCK, ACID, HIVE, MUD, EMPTY, UNKNOWN, MAP_EDGE};
enum FOOD_TYPE {BREAD, APPLE, NECTAR};
using json = nlohmann::json;

struct Hex
{
    HEX_TYPE type;
    FOOD_TYPE foodType;
    short int foodAmount;
    short int cost;
};

class Field
{
public:
    json data;
    Field(std::string fileName);
    static std::vector<std::pair<long int, long int>> getNearHexes(long int x, long int y);
    long int height, width, yOffset, xOffset;//Вычесть отступ  файл->мы, прибавить отступ мы->файл
    std::vector<std::vector<Hex>> field;
};

#endif // FIELD_H
