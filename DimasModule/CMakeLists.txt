cmake_minimum_required(VERSION 3.5)

project(DimasModule LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(DimasModule main.cpp
    field.h field.cpp ../Unit.h ../Unit.cpp)

include(GNUInstallDirs)
install(TARGETS DimasModule
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
