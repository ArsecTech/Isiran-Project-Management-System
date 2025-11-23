using AutoMapper;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Resources.Queries;

public class GetResourceQueryHandler : IRequestHandler<GetResourceQuery, GetResourceDto?>
{
    private readonly IRepository<Domain.Resources.Resource> _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetResourceQueryHandler> _logger;

    public GetResourceQueryHandler(
        IRepository<Domain.Resources.Resource> repository,
        IMapper mapper,
        ILogger<GetResourceQueryHandler> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<GetResourceDto?> Handle(GetResourceQuery request, CancellationToken cancellationToken)
    {
        var resource = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (resource == null || resource.IsDeleted)
        {
            return null;
        }

        var dto = _mapper.Map<GetResourceDto>(resource);
        return dto;
    }
}

