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
    
    bool isPointValid(long int x, long int y) const {
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    HEX_TYPE getHexType(long int x, long int y) const {
        return field[x][y].type;
    }

    std::pair<long int, long int> getAnthillPosition() const {
        // Реализация поиска муравейника
        for (long int x = 0; x < width; x++) {
            for (long int y = 0; y < height; y++) {
                if (field[x][y].type == HIVE) {
                    return { x + xOffset, y + yOffset };
                }
            }
        }
        return { -1, -1 }; // Если не найден
    }

private:
    static std::vector<std::pair<long int, long int>> getNearHexes(long int x, long int y);
    long int height, width, yOffset, xOffset;//Вычесть отступ  файл->мы, прибавить отступ мы->файл
    std::vector<std::vector<Hex>> field;
};

#endif // FIELD_H
