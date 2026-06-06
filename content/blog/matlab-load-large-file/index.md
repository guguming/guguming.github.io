---
title: 🛠️ MATLAB 读取大型文本数据文件的方法
date: 2025-12-11T23:57:40+08:00
lastmod: 2025-12-11T23:57:40+08:00
url: /matlab-load-large-file/
---

很多测试数据存储在大型文本文件（如 CSV）中。考虑采样率为 1kHz 的情况，持续采集几分钟就能产生百万行数据文件。

本文考虑 csv 文件，其特征在于：

1. 具有标题行，有的场景下标题行数目不固定
2. 每行数据列数固定，分隔符固定（比如逗号或分号）

本文介绍提升 MATLAB 读取大型文本数据文件性能的方法。

<!--more-->

## 读取大文件：使用 `textscan` 替代 `readtable`

考虑如下 csv 文件：

```csv
# Data acquisition time, Epoch time (ms), Distance1 (μm), Distance2 (μm), Distance3 (μm), Distance4 (μm)
2025-12-02 15:02:50.881160, 1764658970881.160, 143.571, 126.013, 153.311, 139.996
2025-12-02 15:02:50.881416, 1764658970881.416, 143.569, 126.012, 153.311, 139.998
2025-12-02 15:02:50.881672, 1764658970881.672, 143.569, 126.015, 153.307, 139.998
2025-12-02 15:02:50.881928, 1764658970881.928, 143.567, 126.015, 153.312, 139.995
2025-12-02 15:02:50.882184, 1764658970882.184, 143.570, 126.013, 153.308, 139.998
...
```

初始代码使用 `readtable` 读取数据：

```MATLAB
%% 设置导入选项并导入数据
opts = delimitedTextImportOptions("NumVariables", 6);

% 指定范围和分隔符
opts.DataLines = [2, Inf];
opts.Delimiter = ",";

% 指定列名称和类型
opts.VariableNames = ["acq_time", "epoch_time_ms", "dist1_um", "dist2_um", "dist3_um", "dist4_um"];
opts.VariableTypes = ["datetime", "double", "double", "double", "double", "double"];

% 指定文件级属性
opts.ExtraColumnsRule = "ignore";
opts.EmptyLineRule = "read";
opts.ConsecutiveDelimitersRule = "join";

% 指定变量属性
opts = setvaropts(opts, "acq_time", "InputFormat", "yyyy-MM-dd HH:mm:ss.SSSSSS", "DatetimeFormat", "preserveinput");
opts = setvaropts(opts, ["epoch_time_ms", "dist1_um", "dist2_um", "dist3_um", "dist4_um"], "ThousandsSeparator", ",");

% 导入数据
tic;
T = readtable(filePath, opts);
toc;
```

> 历时 1.919952 秒。

`textscan` 是底层 C 实现，比 `readtable` 快 2-3倍。

```MATLAB
% 打开文件
fid = fopen(filePath, 'r', 'n', 'US-ASCII');

% 跳过标题行
header = fgetl(fid);

% 定义格式字符串
formatSpec = '%s%f%f%f%f%f';

% 使用 textscan 读取数据
tic;
data = textscan(fid, formatSpec, 'Delimiter', ',', 'CollectOutput', true);
toc;
fclose(fid);

% 解析数据
tic;
acq_time = datetime(data{1}, 'InputFormat', 'yyyy-MM-dd HH:mm:ss.SSSSSS');
numeric_data = data{2};
epoch_time_ms = numeric_data(:, 1);
dist1_um = numeric_data(:, 2);
dist2_um = numeric_data(:, 3);
dist3_um = numeric_data(:, 4);
dist4_um = numeric_data(:, 5);

% 构建表格
T = table(acq_time, epoch_time_ms, dist1_um, dist2_um, dist3_um, dist4_um);
toc;
```

> 历时 0.650829 秒。（用时减少 66%）
> 历时 0.168380 秒。（考虑数据解析的总用时减少 57%）

## 优化文件打开参数

数据基本上只由 ASCII 字符组成（数字、逗号、换行等），我们可以优化 `fopen` 的参数，这里显式指定机器格式为 `'native'`，避免做不必要的字节序转换；同时将字符编码固定为 US-ASCII，跳过自动编码检测，从而进一步提升性能：

```MATLAB
fid = fopen(filePath, 'r', 'n', 'US-ASCII');
%                           ↑    ↑
%                           |    └─ US-ASCII 字符集最简单，解析开销最小
%                           └────── 按本机字节序读写二进制数据
```

| 编码方案 | 耗时 | 相对性能 |
|---------|------|---------|
| 不指定（自动检测） | ~1.0s | 基准 |
| GB18030 | 0.75s | +25% |
| UTF-8 | 0.70s | +30% |
| **US-ASCII** | **0.65s** | **+35%** ⭐ |

## 处理变长标题行

有时标题行位置不固定，比如随测量通道数变化：

```csv
# softwareVersion: 1.2.3.4
# SensorTypeName: veryGoodSensor XXXX, ...
# SignalName, SensorName, SerialNumber, ArticleNumber, RangeMin, RangeMax             
# Distance1, DL1234, 0002, 1234567, 0 μm, 200 μm
# Distance2, DL1234, 0003, 1234567, 0 μm, 200 μm
# Distance3, DL1234, 0004, 1234567, 0 μm, 200 μm
# Distance4, DL1234, 0005, 1234567, 0 μm, 200 μm
# 1_Averaging:Disabled, 2_Triggering:Disabled, 3_Subsampling:Disabled, 4_Mastering:Disabled
# Data acquisition time, Epoch time (ms), Distance1 (μm), Distance2 (μm), Distance3 (μm), Distance4 (μm)
2025-12-02 15:02:50.881160, 1764658970881.160, 143.571, 126.013, 153.311, 139.996
...
```

这时我们当然希望能动态定位标题行，而不是手动数行。注意到“真正的”标题行是：

```csv
# Data acquisition time, Epoch time (ms), Distance1 (μm), Distance2 (μm), Distance3 (μm), Distance4 (μm)
```

容易想到的做法是逐行读取，直到找到该行：

```MATLAB
fid = fopen(filePath, 'r', 'n', 'US-ASCII');
tic;
while ~feof(fid)
    line = fgetl(fid);
    if startsWith(line, '# Data acquisition time')
        fprintf('Found header line.\n');
        break;
    end
end
toc;
% 读取数据部分
```

> Found header line.
> 历时 0.786832 秒。

更快的方法是使用 `fread` 一次性读取整个文件内容，然后使用 `strfind` 在内存中搜索标题行：

```MATLAB
fid = fopen(filePath, 'r', 'n', 'US-ASCII');
file_content = fread(fid, '*char')';
fclose(fid);

% 查找并提取标题行
tic;
[header_line, data_start_pos] = find_data_header(file_content);
toc;

% 解析变量名（从第3列开始）
header_cells = strsplit(header_line, ',');
vars = cellfun(@(x) ['d' regexp(x, '\d+', 'match', 'once')], ...
                header_cells(3:end), 'UniformOutput', false);

% 读取数据（跳过前两列）
data_content = file_content(data_start_pos:end);
format_str = ['%*s%*f', repmat('%f', 1, numel(vars))];  % 动态生成格式字符串
data_cells = textscan(data_content, format_str, 'Delimiter', ',');

% 合并为二维数组
D = [data_cells{:}];

function [header_line, data_start_pos] = find_data_header(file_content)
    % 定位标题行
    marker = '# Data acquisition time';
    pos = strfind(file_content, marker);
    if isempty(pos)
        error('未找到以 "%s" 开头的标题行', marker);
    end

    % 回溯到行首（上一行换行符之后）
    line_start = pos(1);
    if line_start > 1
        prev_nl = regexp(file_content(1:line_start-1), '\r?\n', 'once', 'end');
        if ~isempty(prev_nl)
            line_start = prev_nl + 1;
        end
    end

    % 到行尾（下一个换行符之前）
    rel_end = regexp(file_content(line_start:end), '\r?\n', 'once');
    if isempty(rel_end)
        header_line = file_content(line_start:end);
        data_start_pos = length(file_content) + 1;
    else
        line_end = line_start + rel_end - 2;   % 去掉换行本身
        header_line = file_content(line_start:line_end);
        data_start_pos = line_end + 2;         % 跳到下一行开头（兼容 \r?\n）
    end
end
```

> 历时 0.052721 秒。

## 其他

1. 如果数据中包含空数据（即连续分隔符），需要在 `textscan` 中指定 `'EmptyValue', NaN` 以正确处理。
2. 如果可能重复读取同一文件，考虑将数据缓存到 MAT 文件中以加快后续读取速度。

    ```MATLAB
    [fileDir, fileBase] = fileparts(filePath);
    matPath = fullfile(fileDir, [fileBase '.mat']);
    if exist(matPath, 'file')
        cache = load(matPath, 'data', 'vars');
        data = cache.data;
        vars = cache.vars;
    else
        [data, vars] = loaderFunc(filePath);
        save(matPath, 'data', 'vars');
    end
    ```
