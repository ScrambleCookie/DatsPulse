#include "Unit.h"

void Unit::setTarget(int x, int y) {
    target = { x, y };
}

Unit::Unit(int id_, long int x_, long int y_, UNITTYPES typeAncent_) : position({ x_, y_ }), id(id_), typeAncent(typeAncent_)
{
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

std::vector<std::vector<int>> Unit::findingRoad(short int idTacticks)
{
	std::vector<std::vector<int>> res;
	switch (typeAncent)
	{
	case UNITTYPES::worker:
		switch (idTacticks)
		{
        case 1:
        {
            std::vector<std::vector<int>> slice;
            for (int y = 0; y < field.height; y++)
            {
                std::vector<int> vec;
                slice.push_back(vec);
                for (int x = 0; x < field.width; x++)
                {
                    slice[y].push_back(INT_MAX);
                }
            }
            slice[position.first][position.second] = 0;
            std::vector<std::vector<int>> queue = { {position.second},{position.first} };
            int y, x, yNext, xNext;
            double pass;
            bool occupation;
            std::vector<std::vector<int>> nearHexes;
            while (!queue[0].empty())
            {
                y = queue[0][0];
                x = queue[1][0];
                nearHexes = field.getNearHexes(y, x);
                for (int i = 0; i < 6; i++)
                {
                    yNext = nearHexes[0][i];
                    xNext = nearHexes[1][i];
                    occupation = false;
                    
                    if (field.isPointValid(yNext, xNext) && field.getHeightDist(y, x, yNext, xNext) <= maxHeight && !occupation)
                    {
                        pass = slice[y][x] + field.hex[yNext][xNext].passability;
                        if (pass < slice[yNext][xNext])
                        {
                            slice[yNext][xNext] = pass;
                            queue[0].push_back(yNext);
                            queue[1].push_back(xNext);
                        }
                    }
                }
                queue.erase(queue.begin()); 
                queue.erase(queue.begin());
            }
            
            return slice;

        }
			break;
		}
		break;

		//------------------------------------------------------------------------
	case UNITTYPES::warrior:
        switch (idTacticks)
        {
        case 1:
            int rows = field.size();
            if (rows == 0) return {};
            int cols = field[0].size();

            if (target.first < 0 || target.second < 0 ||
                target.first >= rows || target.second >= cols ||
                field[target.first][target.second] == 1) {
                return {};
            }

            // Если враг рядом - атакуем вместо движения
            if (isEnemyInRange()) {
                attack();
                return {};
            }

            const std::vector<std::pair<int, int>> directions = { {-1, 0}, {1, 0}, {0, -1}, {0, 1} };

            std::vector<std::vector<int>> distance(rows, std::vector<int>(cols, -1));
            distance[position.first][position.second] = 0;

            std::queue<std::pair<int, int>> q;
            q.push(position);

            while (!q.empty()) {
                auto current = q.front();
                q.pop();

                if (current == target) {
                    break;
                }

                for (const auto& dir : directions) {
                    int nx = current.first + dir.first;
                    int ny = current.second + dir.second;

                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols &&
                        field[nx][ny] == 0 && distance[nx][ny] == -1) {
                        distance[nx][ny] = distance[current.first][current.second] + 1;
                        q.push({ nx, ny });
                    }
                }
            }

            if (distance[target.first][target.second] == -1) {
                return {};
            }

            std::vector<std::vector<int>> path;
            auto current = target;

            while (current != position) {
                path.push_back({ current.first, current.second });


                for (const auto& dir : directions) {
                    int px = current.first - dir.first;
                    int py = current.second - dir.second;

                    if (px >= 0 && px < rows && py >= 0 && py < cols &&
                        distance[px][py] == distance[current.first][current.second] - 1) {
                        current = { px, py };
                        break;
                    }
                }
            }
            std::reverse(path.begin(), path.end());

            return path;
        


            break;
        }
        break;
	}
	return std::vector<std::vector<int>>();
}
