#include "Unit.h"

std::vector<Unit*> Unit::ourAnts;
std::vector<Unit*> Unit::enemyAnts;

void Unit::setTarget(int x, int y) {
    target = { x, y };
}

Unit::Unit(int id_, long int x_, long int y_, UNITTYPES typeAncent_) : position({ x_, y_ }), id(id_), typeAncent(typeAncent_)
{
    field = new Field("somePath");
	switch (typeAncent)
	{
	case UNITTYPES::warrior:
		maxFood = 2;
		XP = 180;
		Speed = 4;
		break;

	case UNITTYPES::worker:
		maxFood = 8;
		XP = 130;
		Speed = 5;
		break;


	case UNITTYPES::scout:
		maxFood = 2;
		XP = 80;
		Speed = 7;
		break;
	default:
		break;
	}
}

std::vector<std::pair<long, long> > Unit::findingRoad(short int idTacticks)
{
	std::vector<std::vector<int>> res;
    std::pair<long int, long int> current;

    //--------------------  getting moveslice
    /*if (target.first < 0 || target.second < 0 ||
        target.first >= field->width || target.second >= field->height ||
        field->field[target.first][target.second].type == HEX_TYPE::ROCK)
    {
        return {};
    }*/

    std::vector<std::pair<long int, long int>> path;
    std::vector<std::vector<int>> slice;
    for (int x = 0; x < field->width; x++)
    {
        std::vector<int> vec;
        slice.push_back(vec);
        for (int y = 0; y < field->height; y++)
        {
            slice[x].push_back(INT_MAX);
        }
    }
    slice[position.first][position.second] = 0;
    std::vector<std::pair<long int, long int>> queue = {position};
    int y, x, yNext, xNext;
    bool occupation;
    std::vector<std::pair<long int, long int>> nearHexes;
    while (!queue.empty())
    {
        y = queue[0].second;
        x = queue[0].first;
        nearHexes = field->getNearHexes(y, x);
        for (int i = 0; i < 6; i++)
        {
            yNext = nearHexes[i].second;
            xNext = nearHexes[i].first;
            occupation = false;
            //добаввить проверку оккупации
            for(int j = 0; j < ourAnts.size(); j++)
            {
                if(ourAnts[j]->position.first == xNext && ourAnts[j]->position.second == yNext && ourAnts[j]->typeAncent == typeAncent)
                {
                    occupation = true;
                    break;
                }
            }
            if(!occupation)
            {
                for(int j = 0; j < enemyAnts.size(); j++)
                {
                    if(enemyAnts[j]->position.first == xNext && enemyAnts[j]->position.second == yNext)
                    {
                        occupation = true;
                        break;
                    }
                }
            }
            if (!occupation && slice[xNext][yNext]-field->field[xNext][yNext].cost > slice[x][y] &&
                (field->field[xNext][yNext].type != HEX_TYPE::ACID || field->field[xNext][yNext].type != HEX_TYPE::ROCK ))
            {
                slice[xNext][yNext] = slice[x][y] + field->field[xNext][yNext].cost;
                queue.push_back({xNext, yNext});
            }
        }
        queue.erase(queue.begin());
        queue.erase(queue.begin());
    }

    /*if (slice[target.first][target.second] == INT_MAX)
    {
        return {};
    }*/
    //-------------------


	switch (typeAncent)
	{
	case UNITTYPES::worker:
		switch (idTacticks)
		{
        case 1:
        {
            if(foodAmount < maxFood)
            {
                int nearestFoodDist = INT_MAX;
                std::pair<long int, long int> nearestFoodHex;
                for(int x = 0; x < field->width; x++)
                {
                    for(int y = 0; y < field->height; y++)
                    {
                        if(slice[x][y] < nearestFoodDist)
                        {
                            nearestFoodHex = {x, y};
                            nearestFoodDist = slice[x][y];
                        }
                    }
                }
                if(nearestFoodDist != INT_MAX)
                {
                    target = nearestFoodHex;
                }
                else
                {
                    target = field->getNearHexes(position.first, position.second)[rand()%6];
                }
            }
            else
            {
                target = МУРАВЕЙНИК;
            }
        }
			break;
		}
		break;

		//------------------------------------------------------------------------
	case UNITTYPES::warrior:
        switch (idTacticks)
        {
        case 1:
            bool isThereEnemyNear = false;
            auto current = target;
            // Если враг рядом - атакуем вместо движения
            for(int i = 0; i < enemyAnts.size(); i++)
            {
                if(slice[enemyAnts[i]->position.first][enemyAnts[i]->position.second] <= Speed+1)
                {
                    target = enemyAnts[i]->position;
                    isThereEnemyNear = true;
                    break;
                }
            }
            if(!isThereEnemyNear)
            {
                int nearestWorker = -1;
                std::pair<long int, long int> nearestWorkerHex;
                int nearestWorkerDist = INT_MAX;
                for(int i = 0; i < ourAnts.size(); i++)
                {
                    if(slice[ourAnts[i]->position.first][ourAnts[i]->position.second] < nearestWorkerDist)
                    {
                        nearestWorker = i;
                        nearestWorkerDist = slice[ourAnts[i]->position.first][ourAnts[i]->position.second];
                    }
                }
                if(nearestWorker != -1)
                {
                    for(auto i : Field::getNearHexes(ourAnts[nearestWorker]->position.first, ourAnts[nearestWorker]->position.second))
                    {
                        if(slice[i.first][i.second] < nearestWorkerDist)
                        {
                            nearestWorkerDist = slice[i.first][i.second];
                            nearestWorkerHex = i;
                        }
                    }
                    target = nearestWorkerHex;
                }
                else
                {
                    target = position;
                }
            }
            break;
        }
        break;
    }
    current = target;
    while (current != position)
    {
        path.push_back({current.first, current.second});
        for (const auto& dir : field->getNearHexes(current.first, current.second))
        {
            int px = current.first - dir.first;
            int py = current.second - dir.second;

            if (px >= 0 && px < field->width && py >= 0 && py < field->height &&
                slice[px][py] == slice[current.first][current.second] - field->field[current.first][current.second].cost)
            {
                current = {px, py};
                break;
            }
        }
    }
    std::reverse(path.begin(), path.end());
    return path;
}

void Unit::loadAnts()
{
    for(int i = 0; i < field->data["ants"].size(); i++)
    {
        Unit::ourAnts.push_back(new Unit(field->data["ants"][i]["id"], (long int)(field->data["ants"][i]["q"])-field->xOffset, (long int)(field->data["ants"][i]["r"])-field->yOffset,
                               field->data["ants"][i]["type"], field->data["ants"][i]["health"], field->data["ants"][i]["food"]["amount"],
                               static_cast<FOOD_TYPE>(field->data["ants"][i]["food"]["type"])));
    }
    for(int i = 0; i < field->data["enemies"].size(); i++)
    {
        Unit::enemyAnts.push_back(new Unit(0, (long int)(field->data["ants"][i]["q"])-field->xOffset, (long int)(field->data["ants"][i]["r"])-field->yOffset,
                                 field->data["ants"][i]["type"], field->data["ants"][i]["health"], field->data["ants"][i]["food"]["amount"],
                                 static_cast<FOOD_TYPE> (field->data["ants"][i]["food"]["type"])));
    }
}
