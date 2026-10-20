/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";
import "./.next/dev/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
Bước 1: Không dùng thread
Khảo sát đoạn mã sau và triển khai thành chương trình, chạy chương trình:
#define INTERVAL 1000
using namespace std;
 
int main()
{
    int interval, i;
    double rand_x, rand_y, origin_dist, pi;
    int circle_points = 0, square_points = 0;
 
    // Initializing rand()
    srand(time(NULL));
 
    // Total Random numbers generated = possible x
    // values * possible y values
    for (i = 0; i < (INTERVAL * INTERVAL); i++) {
 
        // Randomly generated x and y values
        rand_x = double(rand() % (INTERVAL + 1)) / INTERVAL;
        rand_y = double(rand() % (INTERVAL + 1)) / INTERVAL;
 
        // Distance between (x, y) from the origin
        origin_dist = rand_x * rand_x + rand_y * rand_y;
 
        // Checking if (x, y) lies inside the define
        // circle with R=1
        if (origin_dist <= 1)
            circle_points++;
 
        // Total number of points generated
        square_points++;
 
        // estimated pi after this iteration
        pi = double(4 * circle_points) / square_points;
 
        // For visual understanding (Optional)
        cout << rand_x << " " << rand_y << " " << circle_points << " " << square_points << "
" << pi << endl;
 
        // Pausing estimation for first 10 values (Optional)
        //if (i < 10)
          // getchar();
    }
 
    // Final Estimated Value
    cout << "\nFinal Estimation of Pi = " << pi;
Bước 2: Dùng thread

Khảo sát đoạn mã sau và triển khai thành chương trình, chạy chương trình:

constexpr auto num_threads = 1; //number of threads
constexpr auto total_count = 10000055; //total number of iterations

void doCalcs(int total_iterations, int & in_count_result)
{
    auto seed = std::random_device{}();
    auto gen = std::mt19937{ seed };
    auto dist = std::uniform_real_distribution<>{0, 1};

    auto in_count{ 0 };

    //calculation
    for (auto counter = 0; counter < total_iterations; ++counter) {
        auto x = dist(gen);
        auto y = dist(gen);
        auto result = std::sqrt(std::pow(x, 2) + std::pow(y, 2));
        if (result < 1) {
            ++in_count; //check if the generated value is inside a unit circle
        }
    }

    in_count_result = in_count;
}

int main()
{
    std::vector<std::thread> threads(num_threads);
    std::vector<int> in_count(num_threads);
    in_count.resize(num_threads);

    for (size_t i = 0; i < num_threads; ++i) {
        int total_iterations = total_count / num_threads;
        if (i == 0) {
            total_iterations += total_count % num_threads; // get the remaining iterations calculated by thread 0
        }

        threads.emplace_back(doCalcs, total_iterations, std::ref(in_count[i]));
    }

    for (auto & thread : threads) {
        if (thread.joinable()) {
            thread.join();
        }
    }

    double pi_value = 4.0 * static_cast<double>(std::accumulate(in_count.begin(), in_count.end(), 0)) / static_cast<double>(total_count);
    std::cout << "Value of PI is: " << pi_value << std::endl;
}

Bước 3: Điều chỉnh các tham số
Thay đổi các tham số cấu hình và chạy lại bước 1 và 2

Phân tích, nhận xét đánh giá, viết và nộp file báo cáo.
