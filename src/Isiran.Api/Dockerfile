FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Isiran.Api/Isiran.Api.csproj", "Isiran.Api/"]
COPY ["Isiran.Application/Isiran.Application.csproj", "Isiran.Application/"]
COPY ["Isiran.Domain/Isiran.Domain.csproj", "Isiran.Domain/"]
COPY ["Isiran.Infrastructure/Isiran.Infrastructure.csproj", "Isiran.Infrastructure/"]
COPY ["Isiran.Core/Isiran.Core.csproj", "Isiran.Core/"]
COPY ["Isiran.GanttEngine/Isiran.GanttEngine.csproj", "Isiran.GanttEngine/"]
RUN dotnet restore "Isiran.Api/Isiran.Api.csproj"
COPY . .
WORKDIR "/src/Isiran.Api"
RUN dotnet build "Isiran.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Isiran.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Isiran.Api.dll"]

